"""
Crop JPG Tool Endpoint
Specialized JPEG cropping with transforms and enhancements
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/crop-jpg", tags=["Media Tools"])

@router.post("")
async def crop_jpg(
    file: UploadFile = File(..., description="JPEG file to crop"),
    x: Optional[int] = Form(0, description="X position"),
    y: Optional[int] = Form(0, description="Y position"),
    width: Optional[int] = Form(None, description="Crop width"),
    height: Optional[int] = Form(None, description="Crop height"),
    aspectRatio: str = Form("free", description="Aspect ratio: free, 1:1, 4:3, 16:9, custom"),
    autoSubjectCrop: bool = Form(False, description="Auto detect and crop subject"),
    rotation: int = Form(0, description="Rotation angle (-180 to 180)"),
    flipH: bool = Form(False, description="Flip horizontally"),
    flipV: bool = Form(False, description="Flip vertically"),
    zoom: int = Form(100, description="Zoom percentage (50-200)"),
    quality: int = Form(90, description="Output quality (1-100)"),
    autoEnhance: bool = Form(False, description="Auto enhance output"),
    removeExif: bool = Form(True, description="Remove EXIF metadata"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Crop JPEG images
    
    **Features:**
    - Quality control
    - Multiple crop modes
    - Optimize output
    - Fast processing
    
    **Perfect For:**
    - Photographs
    - Social media images
    - Web images
    - Profile pictures
    
    See /crop-image/info for detailed crop mode documentation
    """
    
    try:
        # Validate JPEG
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.jpg")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_cropped.jpg")
        
        # Determine crop mode based on aspect ratio
        mode = 'smart' if aspectRatio != 'free' else 'pixels'
        
        # Crop options with all settings
        options = {
            'mode': mode,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'aspect_ratio': aspectRatio if aspectRatio != 'free' else None,
            'format': 'JPEG',
            'quality': quality,
            'rotation': rotation,
            'flip_horizontal': flipH,
            'flip_vertical': flipV,
            'zoom': zoom,
            'auto_enhance': autoEnhance,
            'strip_metadata': removeExif,
            'auto_subject_crop': autoSubjectCrop
        }
        
        ImageProcessor.crop_image_advanced(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_cropped.jpg"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/jpeg"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Crop JPG",
        "description": "Crop JPEG images with quality control",
        "features": [
            "Quality control",
            "Multiple crop modes",
            "Optimize output",
            "Fast processing"
        ],
        "best_for": [
            "Photographs",
            "Social media",
            "Web images",
            "Profile pictures"
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
