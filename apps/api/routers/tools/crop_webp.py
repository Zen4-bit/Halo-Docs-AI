"""
Crop WebP Tool Endpoint
Specialized WebP cropping
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/crop-webp", tags=["Media Tools"])

@router.post("")
async def crop_webp(
    file: UploadFile = File(..., description="WebP file to crop"),
    mode: str = Form("pixels", description="Crop mode: pixels, percentage, center, smart"),
    x: Optional[int] = Form(0, description="X position"),
    y: Optional[int] = Form(0, description="Y position"),
    width: Optional[int] = Form(None, description="Crop width"),
    height: Optional[int] = Form(None, description="Crop height"),
    aspect_ratio: Optional[str] = Form(None, description="Aspect ratio (for smart mode)"),
    quality: int = Form(95, description="Output quality (1-100)"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Crop WebP images
    
    **Features:**
    - Modern format support
    - Quality control
    - Transparency support
    - Small file size
    
    **WebP Advantages:**
    - Better compression than JPEG
    - Transparency like PNG
    - Modern browsers support
    - Smaller file sizes
    
    See /crop-image/info for detailed crop mode documentation
    """
    
    try:
        # Validate WebP
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.webp")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_cropped.webp")
        
        # Crop options
        options = {
            'mode': mode,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'aspect_ratio': aspect_ratio,
            'format': 'WEBP',
            'quality': quality
        }
        
        ImageProcessor.crop_image(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_cropped.webp"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/webp"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Crop WebP",
        "description": "Crop WebP images with quality control",
        "features": [
            "Modern format",
            "Quality control",
            "Transparency support",
            "Small file size",
            "Multiple crop modes"
        ],
        "webp_advantages": [
            "Better compression than JPEG",
            "Transparency like PNG",
            "Modern browser support",
            "Smaller files"
        ],
        "options": {
            "mode": "string - Crop mode",
            "x": "int - X position",
            "y": "int - Y position",
            "width": "int - Crop width",
            "height": "int - Crop height",
            "aspect_ratio": "string - Aspect ratio",
            "quality": "int - Output quality (1-100)",
            "output_filename": "string - Output filename"
        }
    }
