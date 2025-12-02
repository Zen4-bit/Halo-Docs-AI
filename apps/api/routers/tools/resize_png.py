"""
Resize PNG Tool Endpoint
Specialized PNG resizing with transparency preservation
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/resize-png", tags=["Media Tools"])

@router.post("")
async def resize_png(
    file: UploadFile = File(..., description="PNG file to resize"),
    width: Optional[int] = Form(None, description="Target width"),
    height: Optional[int] = Form(None, description="Target height"),
    resizeMode: str = Form("fit", description="Resize mode: fit, fill, stretch, exact"),
    maintainAspect: bool = Form(True, description="Maintain aspect ratio"),
    preserveTransparency: bool = Form(True, description="Preserve transparency"),
    sharpen: bool = Form(False, description="Sharpen after resize"),
    compressionLevel: int = Form(9, description="PNG compression level (1-9)"),
    interlaced: bool = Form(False, description="Interlaced PNG"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Resize PNG images with transparency preservation
    
    **Features:**
    - Preserve transparency
    - High quality resize
    - Multiple modes
    - Lossless output
    
    **Perfect For:**
    - Logos with transparency
    - Icons
    - Graphics
    - Screenshots
    
    **Note:** PNG resizing maintains transparency and uses high-quality resampling
    """
    
    try:
        # Validate PNG
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not width and not height:
            raise HTTPException(status_code=400, detail="Must specify at least width or height")
        
        # Verify PNG
        content = await file.read()
        await file.seek(0)
        if not content.startswith(b'\x89PNG'):
            raise HTTPException(status_code=400, detail="File is not a valid PNG")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.png")
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_resized.png")
        
        # Resize options with all settings
        options = {
            'width': width,
            'height': height,
            'mode': resizeMode,
            'maintain_aspect': maintainAspect,
            'format': 'PNG',
            'quality': 100,
            'preserve_transparency': preserveTransparency,
            'sharpen': sharpen,
            'compression_level': compressionLevel,
            'interlaced': interlaced
        }
        
        ImageProcessor.resize_image_advanced(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_resized.png"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/png"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resize failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Resize PNG",
        "description": "Resize PNG images with transparency preservation",
        "features": [
            "Preserve transparency",
            "High quality resize",
            "Multiple modes",
            "Lossless output"
        ],
        "best_for": [
            "Logos with transparency",
            "Icons",
            "Graphics",
            "Screenshots"
        ],
        "options": {
            "width": "int - Target width",
            "height": "int - Target height",
            "mode": "string - Resize mode (fit/fill/stretch/thumbnail)",
            "maintain_aspect": "bool - Keep aspect ratio",
            "output_filename": "string - Output filename"
        }
    }
