"""
Resize JPG Tool Endpoint
Specialized JPEG resizing
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/resize-jpg", tags=["Media Tools"])

@router.post("")
async def resize_jpg(
    file: UploadFile = File(..., description="JPEG file to resize"),
    width: Optional[int] = Form(None, description="Target width"),
    height: Optional[int] = Form(None, description="Target height"),
    mode: str = Form("fit", description="Resize mode: fit, fill, stretch, thumbnail"),
    maintain_aspect: bool = Form(True, description="Maintain aspect ratio"),
    quality: int = Form(90, description="Output quality (1-100)"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Resize JPEG images
    
    **Features:**
    - Quality control
    - Multiple resize modes
    - Fast processing
    - Optimize output
    
    **Perfect For:**
    - Photographs
    - Social media images
    - Web images
    - Profile pictures
    
    **Quality Guide:**
    - 90-100: High quality
    - 80-90: Good quality (recommended)
    - 70-80: Medium quality
    - Below 70: Lower quality
    """
    
    try:
        # Validate JPEG
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not width and not height:
            raise HTTPException(status_code=400, detail="Must specify at least width or height")
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.jpg")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_resized.jpg")
        
        # Resize options
        options = {
            'width': width,
            'height': height,
            'mode': mode,
            'maintain_aspect': maintain_aspect,
            'format': 'JPEG',
            'quality': quality
        }
        
        ImageProcessor.resize_image(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_resized.jpg"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/jpeg"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resize failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Resize JPG",
        "description": "Resize JPEG images with quality control",
        "features": [
            "Quality control",
            "Multiple modes",
            "Fast processing",
            "Optimize output"
        ],
        "best_for": [
            "Photographs",
            "Social media",
            "Web images",
            "Profile pictures"
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
