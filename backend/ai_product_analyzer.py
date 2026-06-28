"""
RestArtuz Gemini AI Product Description Service
Automatically generates professional multilingual product descriptions from images
Using Google GenAI SDK (2026 version)
"""

import os
import base64
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configure logging to show in console
logging.basicConfig(level=logging.INFO)

@dataclass
class ProductAnalysis:
    """Result of AI product analysis"""
    # Product titles in multiple languages
    title_uz: str = ""
    title_ru: str = ""
    title_en: str = ""
    
    # Product descriptions in multiple languages
    description_uz: str = ""
    description_ru: str = ""
    description_en: str = ""
    
    # Detected attributes
    product_type: str = ""
    material: str = ""
    color: str = ""
    colors: List[str] = None
    pattern: str = ""
    texture: str = ""
    style: str = ""
    surface: str = ""
    finish: str = ""
    interior_usage: List[str] = None
    
    # Dimensions
    width: str = ""
    height: str = ""
    thickness: str = ""
    
    # Additional info
    category_suggestion: str = ""
    collection: str = ""
    product_code_suggestion: str = ""
    
    # SEO data
    seo_keywords: List[str] = None
    seo_description: str = ""
    
    # Analysis metadata
    confidence: float = 0.0
    error_message: str = ""
    raw_response: str = ""
    
    def __post_init__(self):
        if self.interior_usage is None:
            self.interior_usage = []
        if self.seo_keywords is None:
            self.seo_keywords = []
        if self.colors is None:
            self.colors = []


class GeminiProductAnalyzer:
    """
    AI-powered product analyzer using Google GenAI SDK (2026)
    
    Analyzes product images to generate:
    - Professional titles and descriptions (Uzbek, Russian, English)
    - Product attributes (type, material, color, pattern, texture, style)
    - Interior usage suggestions
    - SEO-optimized content
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-2.0-flash"  # Default model
        self._client = None
        
        logger.info(f"GeminiProductAnalyzer initialized")
        logger.info(f"API Key configured: {'Yes' if self.api_key else 'No'}")
        if self.api_key:
            logger.info(f"API Key starts with: {self.api_key[:10]}...")
        
    def _get_client(self):
        """Get or create GenAI client instance"""
        if self._client is None:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            from google import genai
            
            self._client = genai.Client(api_key=self.api_key)
            logger.info(f"Successfully initialized GenAI client")
        
        return self._client
    
    def _get_analysis_prompt(self) -> str:
        """Get the prompt for product analysis"""
        return """You are a professional interior design product analyst and SEO expert.

Analyze these product images for a premium interior decoration materials catalog (tiles, marble, stone, wallpaper, decorative panels, onyx, PVC panels, etc.).

Look at ALL the images and generate ONE comprehensive product analysis.

IMPORTANT: You must respond with a valid JSON object exactly like this structure (no markdown, no code blocks, just pure JSON):

{
    "title": {
        "uz": "Professional product title in Uzbek (Latin script)",
        "ru": "Professional product title in Russian (Cyrillic)",
        "en": "Professional product title in English"
    },
    "description": {
        "uz": "Detailed professional description in Uzbek (3-4 sentences, Latin script, highlight premium features)",
        "ru": "Detailed professional description in Russian (3-4 sentences, Cyrillic, highlight premium features)",
        "en": "Detailed professional description in English (3-4 sentences, highlight premium features)"
    },
    "attributes": {
        "product_type": "tiles/marble/stone/wallpaper/panel/mosaic/onyx/pvc/glass/etc",
        "material": "detected material (ceramic/porcelain/natural stone/marble/onyx/pvc/glass/etc)",
        "color": "primary color name",
        "colors": ["color1", "color2"],
        "pattern": "pattern type (solid/veined/geometric/textured/floral/abstract/marble-effect/etc)",
        "texture": "texture description (smooth/matte/glossy/rough/polished/semi-polished)",
        "style": "design style (modern/classic/minimalist/luxury/industrial/art-deco/etc)",
        "surface": "surface type (glossy/matte/satin/textured/3d/embossed)",
        "finish": "finish type (polished/honed/brushed/natural/glazed)"
    },
    "dimensions": {
        "width": "estimated width in cm (e.g., 60)",
        "height": "estimated height in cm (e.g., 120)",
        "thickness": "estimated thickness in mm (e.g., 10)"
    },
    "interior_usage": ["kitchen", "bathroom", "living_room", "bedroom", "hallway", "office", "commercial"],
    "category_suggestion": "best matching category (kitchen_backsplash/wall_tiles/floor_tiles/decorative_panels/onyx/marble/natural_stone)",
    "collection": "suggested collection name",
    "seo": {
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
        "description": "SEO meta description in English (max 160 chars)"
    },
    "product_code_suggestion": "suggested product code (e.g., MRB-001, ONX-002, PVC-003)",
    "confidence": 0.95
}

Focus on luxury and premium aspects. Be specific about materials, design features and dimensions.
For Uzbek: Write in proper Uzbek using Latin script (e.g., "Premium marmar plitkalari").
For Russian: Write in proper Russian using Cyrillic (e.g., "Премиальная мраморная плитка").
Estimate dimensions based on typical industry standards for the detected product type.

RESPOND ONLY WITH THE JSON OBJECT, NO OTHER TEXT."""
    
    async def analyze_images(self, images_base64: List[str]) -> ProductAnalysis:
        """
        Analyze product images and generate descriptions
        
        Args:
            images_base64: List of base64-encoded images (can include data URL prefix)
            
        Returns:
            ProductAnalysis with all generated content
        """
        from google import genai
        from google.genai import types
        
        logger.info(f"Starting image analysis with {len(images_base64)} images")
        
        try:
            client = self._get_client()
            
            # Prepare image parts for the new API
            contents = [self._get_analysis_prompt()]
            
            for i, img_b64 in enumerate(images_base64[:5]):  # Limit to 5 images
                # Clean base64 string - remove data URL prefix if present
                if ',' in img_b64:
                    img_b64 = img_b64.split(',')[1]
                
                # Decode to verify it's valid
                try:
                    image_data = base64.b64decode(img_b64)
                    logger.info(f"Image {i+1}: {len(image_data)} bytes")
                    
                    # Create image part using the new SDK format
                    image_part = types.Part.from_bytes(
                        data=image_data,
                        mime_type="image/jpeg"
                    )
                    contents.append(image_part)
                except Exception as e:
                    logger.error(f"Failed to process image {i+1}: {str(e)}")
                    continue
            
            if len(contents) <= 1:  # Only prompt, no images
                raise ValueError("No valid images provided")
            
            logger.info(f"Prepared {len(contents) - 1} image parts for analysis")
            
            # Try different models with fallback - use models confirmed available
            model_options = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
            response = None
            last_error = None
            
            for model_name in model_options:
                try:
                    logger.info(f"Trying model: {model_name}")
                    
                    # Generate content using new SDK
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents
                    )
                    
                    self.model_name = model_name
                    logger.info(f"Successfully used model: {model_name}")
                    break
                    
                except Exception as e:
                    last_error = e
                    logger.warning(f"Model {model_name} failed: {str(e)}")
                    continue
            
            if response is None:
                raise last_error or ValueError("All models failed")
            
            # Log the full response
            logger.info(f"Gemini API Response received")
            response_text = response.text if hasattr(response, 'text') else str(response)
            logger.info(f"Response text length: {len(response_text) if response_text else 0}")
            logger.info(f"Full response text:\n{response_text}")
            
            # Parse the response
            analysis = self._parse_response(response_text)
            logger.info(f"Analysis completed with confidence: {analysis.confidence}")
            
            return analysis
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Gemini analysis error: {error_msg}")
            logger.exception("Full traceback:")
            
            return ProductAnalysis(
                confidence=0.0,
                error_message=error_msg,
                raw_response=f"Error: {error_msg}"
            )
    
    def _parse_response(self, response_text: str) -> ProductAnalysis:
        """Parse AI response into ProductAnalysis"""
        logger.info("Parsing Gemini response...")
        
        try:
            # Clean response - extract JSON
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith("```"):
                lines = text.split("\n")
                # Remove first line (```json) and last line (```)
                text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
            
            # Find JSON in response
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = text[json_start:json_end]
                logger.info(f"Extracted JSON: {json_str[:200]}...")
                data = json.loads(json_str)
            else:
                raise ValueError(f"No valid JSON found in response: {text[:200]}")
            
            analysis = ProductAnalysis(
                title_uz=data.get('title', {}).get('uz', ''),
                title_ru=data.get('title', {}).get('ru', ''),
                title_en=data.get('title', {}).get('en', ''),
                description_uz=data.get('description', {}).get('uz', ''),
                description_ru=data.get('description', {}).get('ru', ''),
                description_en=data.get('description', {}).get('en', ''),
                product_type=data.get('attributes', {}).get('product_type', ''),
                material=data.get('attributes', {}).get('material', ''),
                color=data.get('attributes', {}).get('color', ''),
                colors=data.get('attributes', {}).get('colors', []),
                pattern=data.get('attributes', {}).get('pattern', ''),
                texture=data.get('attributes', {}).get('texture', ''),
                style=data.get('attributes', {}).get('style', ''),
                surface=data.get('attributes', {}).get('surface', ''),
                finish=data.get('attributes', {}).get('finish', ''),
                interior_usage=data.get('interior_usage', []),
                width=data.get('dimensions', {}).get('width', ''),
                height=data.get('dimensions', {}).get('height', ''),
                thickness=data.get('dimensions', {}).get('thickness', ''),
                category_suggestion=data.get('category_suggestion', ''),
                collection=data.get('collection', ''),
                product_code_suggestion=data.get('product_code_suggestion', ''),
                seo_keywords=data.get('seo', {}).get('keywords', []),
                seo_description=data.get('seo', {}).get('description', ''),
                confidence=float(data.get('confidence', 0.8)),
                raw_response=response_text
            )
            
            logger.info(f"Parsed analysis - Title EN: {analysis.title_en}")
            logger.info(f"Parsed analysis - Title RU: {analysis.title_ru}")
            logger.info(f"Parsed analysis - Title UZ: {analysis.title_uz}")
            
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {str(e)}")
            logger.error(f"Response was: {response_text[:500]}")
            return ProductAnalysis(
                confidence=0.0,
                error_message=f"Failed to parse JSON: {str(e)}",
                raw_response=response_text
            )
        except Exception as e:
            logger.error(f"Parse error: {str(e)}")
            return ProductAnalysis(
                confidence=0.0,
                error_message=f"Parse error: {str(e)}",
                raw_response=response_text
            )


# Singleton instance
product_analyzer = GeminiProductAnalyzer()


async def analyze_product_images(images_base64: List[str]) -> Dict[str, Any]:
    """
    Convenience function to analyze product images
    
    Args:
        images_base64: List of base64-encoded images
        
    Returns:
        Dictionary with analysis results
    """
    logger.info(f"analyze_product_images called with {len(images_base64)} images")
    
    analysis = await product_analyzer.analyze_images(images_base64)
    
    result = {
        "success": analysis.confidence > 0,
        "titles": {
            "uz": analysis.title_uz,
            "ru": analysis.title_ru,
            "en": analysis.title_en
        },
        "descriptions": {
            "uz": analysis.description_uz,
            "ru": analysis.description_ru,
            "en": analysis.description_en
        },
        "attributes": {
            "product_type": analysis.product_type,
            "material": analysis.material,
            "color": analysis.color,
            "colors": analysis.colors,
            "pattern": analysis.pattern,
            "texture": analysis.texture,
            "style": analysis.style,
            "surface": analysis.surface,
            "finish": analysis.finish
        },
        "dimensions": {
            "width": analysis.width,
            "height": analysis.height,
            "thickness": analysis.thickness
        },
        "interior_usage": analysis.interior_usage,
        "category_suggestion": analysis.category_suggestion,
        "collection": analysis.collection,
        "product_code_suggestion": analysis.product_code_suggestion,
        "seo": {
            "keywords": analysis.seo_keywords,
            "description": analysis.seo_description
        },
        "confidence": analysis.confidence,
        "error_message": analysis.error_message,
        "raw_response": analysis.raw_response[:500] if analysis.raw_response else ""  # Truncate for response
    }
    
    logger.info(f"Returning result: success={result['success']}, confidence={result['confidence']}")
    if result['error_message']:
        logger.error(f"Error message: {result['error_message']}")
    
    return result
