"""
Resize WebP Tool Endpoint
Specialized WebP resizing
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/resize-webp", tags=["Media Tools"])

@router.post("")
async def resize_webp(
    file: UploadFile = File(..., description="WebP file to resize"),
    width: Optional[int] = Form(None, description="Target width"),
    height: Optional[int] = Form(None, description="Target height"),
    resizeMode: str = Form("fit", description="Resize mode: fit, fill, stretch, exact"),
    maintainAspect: bool = Form(True, description="Maintain aspect ratio"),
    quality: int = Form(90, description="Output quality (1-100)"),
    lossless: bool = Form(False, description="Lossless compression"),
    preserveTransparency: bool = Form(True, description="Preserve transparency"),
    sharpen: bool = Form(False, description="Sharpen after resize"),
    autoEnhance: bool = Form(False, description="Auto enhance"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Resize WebP images
    
    **Features:**
    - Modern format
    - Quality control
    - Transparency support
    - Small file size
    
    **WebP Advantages:**
    - Better compression
    - Transparency support
    - Modern browsers
    - Smaller files
    
    **Perfect For:**
    - Modern web images
    - High-quality photos
    - Graphics with transparency
    - Fast loading websites
    """
    
    try:
        # Validate WebP
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not width and not height:
            raise HTTPException(status_code=400, detail="Must specify at least width or height")
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.webp")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_resized.webp")
        
        # Resize options with all settings
        options = {
            'width': width,
            'height': height,
            'mode': resizeMode,
            'maintain_aspect': maintainAspect,
            'format': 'WEBP',
            'quality': quality,
            'lossless': lossless,
            'preserve_transparency': preserveTransparency,
            'sharpen': sharpen,
            'auto_enhance': autoEnhance
        }
        
        ImageProcessor.resize_image_advanced(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_resized.webp"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/webp"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resize failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Resize WebP",
        "description": "Resize WebP images with quality control",
        "features": [
            "Modern format",
            "Quality control",
            "Transparency support",
            "Small file size",
            "Multiple modes"
        ],
        "webp_advantages": [
            "Better compression than JPEG",
            "Transparency like PNG",
            "Modern browser support",
            "Smaller files"
        ],
        "options": {
            "width": "int - Target width",
            "height": "int - Target height",
            "mode": "string - Resize mode",
            "maintain_aspect": "bool - Keep aspect ratio",
            "quality": "int - Output quality (1-100)",
            "output_filename": "string - Output filename"
        }
    }
