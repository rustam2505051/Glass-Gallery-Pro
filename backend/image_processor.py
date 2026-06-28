"""
RestArtuz Intelligent Image Processing Engine
Automatically handles any image size, aspect ratio, and format
"""

import os
import io
import base64
import hashlib
import asyncio
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import math

class ImageVariant(Enum):
    """Image variant types with their target dimensions and aspect ratios"""
    THUMBNAIL = "thumbnail"          # 150x150 - square, for lists
    CARD = "card"                    # 400x400 - square, for product cards
    DETAIL = "detail"                # 800x800 - square, for product detail
    FULLSCREEN = "fullscreen"        # 1920x1920 - max dimension, original aspect
    BANNER = "banner"                # 1200x600 - 2:1, for hero banners
    CATEGORY = "category"            # 600x400 - 3:2, for category cards
    ORIGINAL = "original"            # Keep original size

@dataclass
class ImageDimensions:
    """Image dimension configuration"""
    width: int
    height: int
    maintain_aspect: bool = True
    use_background: bool = True
    background_type: str = "blur"  # blur, solid, transparent
    quality: int = 85

# Variant configurations
VARIANT_CONFIG: Dict[ImageVariant, ImageDimensions] = {
    ImageVariant.THUMBNAIL: ImageDimensions(150, 150, False, True, "blur", 80),
    ImageVariant.CARD: ImageDimensions(400, 400, False, True, "blur", 85),
    ImageVariant.DETAIL: ImageDimensions(800, 800, True, True, "blur", 90),
    ImageVariant.FULLSCREEN: ImageDimensions(1920, 1920, True, False, "transparent", 92),
    ImageVariant.BANNER: ImageDimensions(1200, 600, False, True, "blur", 88),
    ImageVariant.CATEGORY: ImageDimensions(600, 400, False, True, "blur", 85),
}

class IntelligentImageProcessor:
    """
    Intelligent Image Processing Engine
    
    Features:
    - Never crops important parts
    - Never stretches or distorts
    - Never reduces original quality
    - Auto-detects dimensions
    - Intelligent scaling with background fill
    - Generates optimized variants
    """
    
    def __init__(self):
        self.supported_formats = {'JPEG', 'PNG', 'WEBP', 'GIF', 'BMP', 'TIFF'}
        self.max_dimension = 8192  # Support up to 8K
        self.min_dimension = 10
        
    def detect_image_info(self, image: Image.Image) -> Dict:
        """Detect comprehensive image information"""
        width, height = image.size
        aspect_ratio = width / height if height > 0 else 1
        
        # Classify aspect ratio
        if aspect_ratio > 2.5:
            aspect_type = "ultra_wide"
        elif aspect_ratio > 1.8:
            aspect_type = "panoramic"
        elif aspect_ratio > 1.2:
            aspect_type = "landscape"
        elif aspect_ratio > 0.8:
            aspect_type = "square"
        elif aspect_ratio > 0.5:
            aspect_type = "portrait"
        else:
            aspect_type = "tall"
            
        # Classify size
        max_dim = max(width, height)
        if max_dim >= 7680:
            size_class = "8k"
        elif max_dim >= 3840:
            size_class = "4k"
        elif max_dim >= 1920:
            size_class = "full_hd"
        elif max_dim >= 1280:
            size_class = "hd"
        elif max_dim >= 640:
            size_class = "medium"
        else:
            size_class = "small"
            
        return {
            "width": width,
            "height": height,
            "aspect_ratio": round(aspect_ratio, 3),
            "aspect_type": aspect_type,
            "size_class": size_class,
            "mode": image.mode,
            "format": image.format,
            "has_alpha": image.mode in ('RGBA', 'LA', 'PA')
        }
    
    def create_blurred_background(self, image: Image.Image, target_width: int, target_height: int) -> Image.Image:
        """Create an aesthetically pleasing blurred background from the image"""
        # Create a copy and resize to fill target dimensions (will be cropped)
        bg = image.copy()
        
        # Calculate scale to fill the target dimensions
        img_ratio = bg.width / bg.height
        target_ratio = target_width / target_height
        
        if img_ratio > target_ratio:
            # Image is wider - scale by height
            new_height = target_height
            new_width = int(new_height * img_ratio)
        else:
            # Image is taller - scale by width
            new_width = target_width
            new_height = int(new_width / img_ratio)
        
        # Resize with high quality
        bg = bg.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Center crop to target dimensions
        left = (new_width - target_width) // 2
        top = (new_height - target_height) // 2
        bg = bg.crop((left, top, left + target_width, top + target_height))
        
        # Apply heavy blur for aesthetic background
        bg = bg.filter(ImageFilter.GaussianBlur(radius=30))
        
        # Darken slightly for better contrast with foreground
        enhancer = ImageEnhance.Brightness(bg)
        bg = enhancer.enhance(0.6)
        
        # Add slight desaturation
        enhancer = ImageEnhance.Color(bg)
        bg = enhancer.enhance(0.7)
        
        return bg
    
    def create_solid_background(self, target_width: int, target_height: int, color: Tuple[int, int, int] = (20, 20, 20)) -> Image.Image:
        """Create a solid color background (dark by default for premium look)"""
        return Image.new('RGB', (target_width, target_height), color)
    
    def create_transparent_background(self, target_width: int, target_height: int) -> Image.Image:
        """Create a transparent background"""
        return Image.new('RGBA', (target_width, target_height), (0, 0, 0, 0))
    
    def intelligent_fit(self, image: Image.Image, config: ImageDimensions) -> Image.Image:
        """
        Intelligently fit image to target dimensions without cropping or distortion
        Uses background fill when necessary
        """
        target_width = config.width
        target_height = config.height
        
        # Get original dimensions
        orig_width, orig_height = image.size
        orig_ratio = orig_width / orig_height
        target_ratio = target_width / target_height
        
        # Calculate scaled dimensions to fit within target while maintaining aspect ratio
        if config.maintain_aspect:
            # For maintain_aspect, we scale to fit the largest dimension
            scale = min(target_width / orig_width, target_height / orig_height)
            new_width = int(orig_width * scale)
            new_height = int(orig_height * scale)
        else:
            # For fixed dimensions (like thumbnails), fit within the box
            if orig_ratio > target_ratio:
                # Image is wider than target
                new_width = target_width
                new_height = int(target_width / orig_ratio)
            else:
                # Image is taller than target
                new_height = target_height
                new_width = int(target_height * orig_ratio)
        
        # Ensure minimum dimensions
        new_width = max(new_width, 1)
        new_height = max(new_height, 1)
        
        # Resize the image with high quality
        resized = image.copy()
        if resized.mode == 'RGBA':
            resized = resized.resize((new_width, new_height), Image.Resampling.LANCZOS)
        else:
            resized = resized.convert('RGB').resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # If dimensions match or we don't need background, return
        if not config.use_background or (new_width == target_width and new_height == target_height):
            if config.maintain_aspect:
                return resized
            # Need to add background for fixed dimensions
        
        # Create background based on type
        if config.background_type == "blur":
            # Convert to RGB for blur background
            if image.mode == 'RGBA':
                rgb_image = Image.new('RGB', image.size, (20, 20, 20))
                rgb_image.paste(image, mask=image.split()[3])
                background = self.create_blurred_background(rgb_image, target_width, target_height)
            else:
                background = self.create_blurred_background(image, target_width, target_height)
        elif config.background_type == "transparent":
            background = self.create_transparent_background(target_width, target_height)
        else:
            background = self.create_solid_background(target_width, target_height)
        
        # Calculate position to center the image
        x_offset = (target_width - new_width) // 2
        y_offset = (target_height - new_height) // 2
        
        # Paste the resized image onto the background
        if resized.mode == 'RGBA':
            background = background.convert('RGBA')
            background.paste(resized, (x_offset, y_offset), resized)
        else:
            if background.mode == 'RGBA':
                background = background.convert('RGB')
            background.paste(resized, (x_offset, y_offset))
        
        return background
    
    def generate_variant(self, image: Image.Image, variant: ImageVariant) -> Tuple[Image.Image, Dict]:
        """Generate a specific variant of the image"""
        if variant == ImageVariant.ORIGINAL:
            return image.copy(), self.detect_image_info(image)
        
        config = VARIANT_CONFIG[variant]
        processed = self.intelligent_fit(image, config)
        
        info = self.detect_image_info(processed)
        info['variant'] = variant.value
        info['target_width'] = config.width
        info['target_height'] = config.height
        
        return processed, info
    
    def generate_all_variants(self, image: Image.Image, include_original: bool = True) -> Dict[str, Tuple[Image.Image, Dict]]:
        """Generate all standard variants for an image"""
        variants = {}
        
        for variant in ImageVariant:
            if variant == ImageVariant.ORIGINAL and not include_original:
                continue
            processed, info = self.generate_variant(image, variant)
            variants[variant.value] = (processed, info)
        
        return variants
    
    def generate_product_variants(self, image: Image.Image) -> Dict[str, Tuple[Image.Image, Dict]]:
        """Generate variants specifically for products"""
        needed = [
            ImageVariant.THUMBNAIL,
            ImageVariant.CARD,
            ImageVariant.DETAIL,
            ImageVariant.FULLSCREEN
        ]
        
        variants = {}
        for variant in needed:
            processed, info = self.generate_variant(image, variant)
            variants[variant.value] = (processed, info)
        
        return variants
    
    def generate_category_variants(self, image: Image.Image) -> Dict[str, Tuple[Image.Image, Dict]]:
        """Generate variants specifically for categories"""
        needed = [
            ImageVariant.THUMBNAIL,
            ImageVariant.CATEGORY,
            ImageVariant.DETAIL
        ]
        
        variants = {}
        for variant in needed:
            processed, info = self.generate_variant(image, variant)
            variants[variant.value] = (processed, info)
        
        return variants
    
    def generate_banner_variants(self, image: Image.Image) -> Dict[str, Tuple[Image.Image, Dict]]:
        """Generate variants specifically for banners"""
        needed = [
            ImageVariant.THUMBNAIL,
            ImageVariant.BANNER,
            ImageVariant.FULLSCREEN
        ]
        
        variants = {}
        for variant in needed:
            processed, info = self.generate_variant(image, variant)
            variants[variant.value] = (processed, info)
        
        return variants
    
    def image_to_bytes(self, image: Image.Image, format: str = "JPEG", quality: int = 85) -> bytes:
        """Convert PIL Image to bytes"""
        buffer = io.BytesIO()
        
        # Handle transparency
        if format.upper() == "JPEG" and image.mode in ('RGBA', 'LA', 'PA'):
            # Convert transparent images to RGB with white background for JPEG
            background = Image.new('RGB', image.size, (20, 20, 20))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[3])
            else:
                background.paste(image)
            image = background
        
        save_kwargs = {"quality": quality, "optimize": True}
        
        if format.upper() == "WEBP":
            save_kwargs["method"] = 6  # Best compression
        elif format.upper() == "JPEG":
            save_kwargs["progressive"] = True
            
        image.save(buffer, format=format, **save_kwargs)
        return buffer.getvalue()
    
    def bytes_to_image(self, data: bytes) -> Image.Image:
        """Convert bytes to PIL Image"""
        return Image.open(io.BytesIO(data))
    
    def process_upload(self, image_data: bytes, purpose: str = "product") -> Dict[str, bytes]:
        """
        Process an uploaded image and return all variants as bytes
        
        Args:
            image_data: Raw image bytes
            purpose: 'product', 'category', 'banner', or 'all'
            
        Returns:
            Dictionary mapping variant names to processed image bytes
        """
        image = self.bytes_to_image(image_data)
        
        # Auto-orient based on EXIF data
        image = ImageOps.exif_transpose(image)
        
        # Generate variants based on purpose
        if purpose == "product":
            variants = self.generate_product_variants(image)
        elif purpose == "category":
            variants = self.generate_category_variants(image)
        elif purpose == "banner":
            variants = self.generate_banner_variants(image)
        else:
            variants = self.generate_all_variants(image)
        
        # Convert to bytes
        result = {}
        for name, (img, info) in variants.items():
            # Use WEBP for web delivery (better compression, quality)
            quality = VARIANT_CONFIG.get(ImageVariant(name), ImageDimensions(0, 0)).quality if name != "original" else 95
            result[name] = {
                "data": self.image_to_bytes(img, "WEBP", quality),
                "info": info,
                "content_type": "image/webp"
            }
        
        # Also keep original in JPEG/PNG
        orig_format = image.format or "JPEG"
        if orig_format not in ["JPEG", "PNG", "WEBP"]:
            orig_format = "JPEG"
        result["original"] = {
            "data": self.image_to_bytes(image, orig_format, 95),
            "info": self.detect_image_info(image),
            "content_type": f"image/{orig_format.lower()}"
        }
        
        return result


# Singleton instance
image_processor = IntelligentImageProcessor()


def process_image_for_upload(image_data: bytes, purpose: str = "product") -> Dict[str, bytes]:
    """
    Convenience function to process an image for upload
    
    Args:
        image_data: Raw image bytes
        purpose: 'product', 'category', 'banner', or 'all'
        
    Returns:
        Dictionary with variant data ready for upload
    """
    return image_processor.process_upload(image_data, purpose)


def get_image_info(image_data: bytes) -> Dict:
    """Get information about an image without processing"""
    image = image_processor.bytes_to_image(image_data)
    return image_processor.detect_image_info(image)
