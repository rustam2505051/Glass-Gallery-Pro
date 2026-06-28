from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from image_processor import image_processor, process_image_for_upload, get_image_info
from ai_product_analyzer import product_analyzer, analyze_product_images


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="RestArtuz API")

# Mount static files for downloads
static_dir = ROOT_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "RestArtuz API", "admin_panel": "/api/admin"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "RestArtuz"}

@api_router.get("/download/{filename}")
async def download_file(filename: str):
    """Download files from admin folder"""
    # Security: only allow specific file extensions
    allowed_extensions = ['.zip', '.json', '.txt']
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=403, detail="File type not allowed")
    
    file_path = ROOT_DIR.parent / "frontend" / "admin" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Admin panel route (non-API route) - served at /api/admin
@api_router.get("/admin")
async def serve_admin():
    """Serve the admin panel HTML"""
    admin_file = ROOT_DIR.parent / "frontend" / "admin" / "index.html"
    if admin_file.exists():
        return FileResponse(admin_file, media_type="text/html")
    return {"error": "Admin panel not found", "path": str(admin_file)}


# ==================== IMAGE PROCESSING API ====================

class ImageProcessRequest(BaseModel):
    """Request model for base64 image processing"""
    image_data: str  # Base64 encoded image
    purpose: str = "product"  # product, category, banner, all
    filename: Optional[str] = None

class ImageVariantInfo(BaseModel):
    """Information about a processed image variant"""
    variant: str
    width: int
    height: int
    aspect_ratio: float
    aspect_type: str
    size_bytes: int
    content_type: str
    data_base64: str

class ImageProcessResponse(BaseModel):
    """Response model for image processing"""
    success: bool
    original_info: Dict[str, Any]
    variants: Dict[str, ImageVariantInfo]
    message: str = ""


@api_router.post("/images/process", response_model=ImageProcessResponse)
async def process_image_endpoint(request: ImageProcessRequest):
    """
    Process an image and return all variants as base64
    
    This endpoint accepts a base64-encoded image and returns
    intelligently processed variants for different use cases.
    """
    try:
        # Decode base64 image
        if ',' in request.image_data:
            # Handle data URL format
            image_data = base64.b64decode(request.image_data.split(',')[1])
        else:
            image_data = base64.b64decode(request.image_data)
        
        # Get original info
        original_info = get_image_info(image_data)
        
        # Process image
        variants_data = process_image_for_upload(image_data, request.purpose)
        
        # Build response
        variants = {}
        for variant_name, variant_data in variants_data.items():
            variants[variant_name] = ImageVariantInfo(
                variant=variant_name,
                width=variant_data["info"]["width"],
                height=variant_data["info"]["height"],
                aspect_ratio=variant_data["info"]["aspect_ratio"],
                aspect_type=variant_data["info"]["aspect_type"],
                size_bytes=len(variant_data["data"]),
                content_type=variant_data["content_type"],
                data_base64=base64.b64encode(variant_data["data"]).decode('utf-8')
            )
        
        return ImageProcessResponse(
            success=True,
            original_info=original_info,
            variants=variants,
            message=f"Successfully processed {len(variants)} variants"
        )
        
    except Exception as e:
        logger.error(f"Image processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")


@api_router.post("/images/upload")
async def upload_and_process_image(
    file: UploadFile = File(...),
    purpose: str = Form(default="product")
):
    """
    Upload an image file and get processed variants
    
    This endpoint accepts a file upload and returns
    intelligently processed variants for different use cases.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Validate file size (max 50MB)
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
        
        # Get original info
        original_info = get_image_info(content)
        
        # Process image
        variants_data = process_image_for_upload(content, purpose)
        
        # Build response
        variants = {}
        for variant_name, variant_data in variants_data.items():
            variants[variant_name] = {
                "variant": variant_name,
                "width": variant_data["info"]["width"],
                "height": variant_data["info"]["height"],
                "aspect_ratio": variant_data["info"]["aspect_ratio"],
                "aspect_type": variant_data["info"]["aspect_type"],
                "size_bytes": len(variant_data["data"]),
                "content_type": variant_data["content_type"],
                "data_base64": base64.b64encode(variant_data["data"]).decode('utf-8')
            }
        
        return {
            "success": True,
            "filename": file.filename,
            "original_info": original_info,
            "variants": variants,
            "message": f"Successfully processed {len(variants)} variants"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")


@api_router.get("/images/variant/{variant_name}")
async def get_variant_preview(variant_name: str, width: int = 400, height: int = 400):
    """Get information about a specific variant configuration"""
    from image_processor import VARIANT_CONFIG, ImageVariant
    
    try:
        variant = ImageVariant(variant_name)
        config = VARIANT_CONFIG.get(variant)
        
        if config:
            return {
                "variant": variant_name,
                "target_width": config.width,
                "target_height": config.height,
                "maintain_aspect": config.maintain_aspect,
                "use_background": config.use_background,
                "background_type": config.background_type,
                "quality": config.quality
            }
        else:
            return {"variant": variant_name, "message": "Original image (no processing)"}
            
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Unknown variant: {variant_name}")


@api_router.get("/images/variants")
async def list_variants():
    """List all available image variants and their configurations"""
    from image_processor import VARIANT_CONFIG, ImageVariant
    
    variants = []
    for variant in ImageVariant:
        config = VARIANT_CONFIG.get(variant)
        if config:
            variants.append({
                "name": variant.value,
                "width": config.width,
                "height": config.height,
                "maintain_aspect": config.maintain_aspect,
                "use_background": config.use_background,
                "background_type": config.background_type,
                "quality": config.quality,
                "description": get_variant_description(variant.value)
            })
        else:
            variants.append({
                "name": variant.value,
                "description": "Original image without processing"
            })
    
    return {"variants": variants}


def get_variant_description(variant_name: str) -> str:
    """Get human-readable description for a variant"""
    descriptions = {
        "thumbnail": "Small square image for lists and grids (150x150)",
        "card": "Square image for product cards (400x400)",
        "detail": "Large image for product detail pages (800x800)",
        "fullscreen": "High-resolution image for fullscreen viewing (up to 1920px)",
        "banner": "Wide image for hero banners (1200x600, 2:1 ratio)",
        "category": "Image for category cards (600x400, 3:2 ratio)",
        "original": "Original uploaded image without processing"
    }
    return descriptions.get(variant_name, "Image variant")


# ==================== AI PRODUCT ANALYSIS API ====================

class AIAnalyzeRequest(BaseModel):
    """Request model for AI product analysis"""
    images: List[str]  # List of base64-encoded images

class AIAnalyzeResponse(BaseModel):
    """Response model for AI product analysis"""
    success: bool
    titles: Dict[str, str]
    descriptions: Dict[str, str]
    attributes: Dict[str, str]
    interior_usage: List[str]
    seo: Dict[str, Any]
    confidence: float
    message: str = ""


@api_router.post("/ai/analyze-product")
async def analyze_product_with_ai(request: AIAnalyzeRequest):
    """
    Analyze product images using Gemini AI
    
    Generates:
    - Professional multilingual titles (Uzbek, Russian, English)
    - Detailed descriptions in all languages
    - Product attributes (type, material, color, pattern, texture, style)
    - Interior usage suggestions
    - SEO keywords and description
    """
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")
        
        # Analyze images
        result = await analyze_product_images(request.images)
        
        return {
            **result,
            "message": "Analysis completed successfully" if result["success"] else "AI analysis unavailable, please enter manually"
        }
        
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        return {
            "success": False,
            "titles": {"uz": "", "ru": "", "en": ""},
            "descriptions": {"uz": "", "ru": "", "en": ""},
            "attributes": {
                "product_type": "",
                "material": "",
                "color": "",
                "pattern": "",
                "texture": "",
                "style": ""
            },
            "interior_usage": [],
            "seo": {"keywords": [], "description": ""},
            "confidence": 0,
            "message": f"AI unavailable: {str(e)}"
        }


@api_router.get("/ai/status")
async def ai_status():
    """Check if AI service is available"""
    gemini_key = os.getenv("GEMINI_API_KEY")
    return {
        "available": bool(gemini_key),
        "model": "gemini-2.5-flash",
        "provider": "google",
        "sdk": "google-genai (2026)",
        "key_configured": gemini_key[:15] + "..." if gemini_key else "NOT SET"
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
