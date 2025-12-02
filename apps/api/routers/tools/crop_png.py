"""
Crop PNG Tool Endpoint
Specialized PNG cropping with transforms
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/crop-png", tags=["Media Tools"])

@router.post("")
async def crop_png(
    file: UploadFile = File(..., description="PNG file to crop"),
    x: Optional[int] = Form(0, description="X position"),
    y: Optional[int] = Form(0, description="Y position"),
    width: Optional[int] = Form(None, description="Crop width"),
    height: Optional[int] = Form(None, description="Crop height"),
    aspectRatio: str = Form("free", description="Aspect ratio: free, 1:1, 4:3, 16:9, custom"),
    rotation: int = Form(0, description="Rotation angle (-180 to 180)"),
    flipH: bool = Form(False, description="Flip horizontally"),
    flipV: bool = Form(False, description="Flip vertically"),
    zoom: int = Form(100, description="Zoom percentage (50-200)"),
    preserveTransparency: bool = Form(True, description="Preserve transparency"),
    edgeSmoothing: bool = Form(False, description="Apply edge smoothing"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Crop PNG images with transparency preservation
    
    **Features:**
    - Preserve transparency
    - Multiple crop modes
    - Lossless operation
    - Optimize output
    
    **Perfect For:**
    - Logos with transparency
    - Icons
    - Screenshots
    - Graphics
    
    See /crop-image/info for detailed crop mode documentation
    """
    
    try:
        # Validate PNG
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Verify it's actually PNG
        content = await file.read()
        await file.seek(0)
        if not content.startswith(b'\x89PNG'):
            raise HTTPException(status_code=400, detail="File is not a valid PNG")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.png")
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_cropped.png")
        
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
            'format': 'PNG',
            'rotation': rotation,
            'flip_horizontal': flipH,
            'flip_vertical': flipV,
            'zoom': zoom,
            'preserve_transparency': preserveTransparency,
            'edge_smoothing': edgeSmoothing
        }
        
        ImageProcessor.crop_image_advanced(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_cropped.png"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/png"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Crop PNG",
        "description": "Crop PNG images with transparency preservation",
        "features": [
            "Preserve transparency",
            "Multiple crop modes",
            "Lossless operation",
            "Optimize output"
        ],
        "best_for": [
            "Logos with transparency",
            "Icons",
            "Screenshots",
            "Graphics"
        ],
        "options": {
            "mode": "string - Crop mode (pixels/percentage/center/smart)",
            "x": "int - X position",
            "y": "int - Y position",
            "width": "int - Crop width",
            "height": "int - Crop height",
            "aspect_ratio": "string - Aspect ratio",
            "output_filename": "string - Output filename"
        }
    }
