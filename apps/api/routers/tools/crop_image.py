"""
Crop Image Tool Endpoint
Universal image cropping
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/crop-image", tags=["Media Tools"])

@router.post("")
async def crop_image(
    file: UploadFile = File(..., description="Image file to crop"),
    x: Optional[int] = Form(0, description="X position"),
    y: Optional[int] = Form(0, description="Y position"),
    width: Optional[int] = Form(None, description="Crop width"),
    height: Optional[int] = Form(None, description="Crop height"),
    aspectRatio: str = Form("free", description="Aspect ratio: free, 1:1, 4:3, 16:9, 3:2, custom"),
    # Transform options
    rotation: int = Form(0, description="Rotation angle (-180 to 180)"),
    flipH: bool = Form(False, description="Flip horizontally"),
    flipV: bool = Form(False, description="Flip vertically"),
    zoom: int = Form(100, description="Zoom percentage (50-200)"),
    # Enhancement options
    autoEnhance: bool = Form(False, description="Auto enhance after crop"),
    sharpen: bool = Form(False, description="Sharpen image"),
    # Output options
    quality: int = Form(90, description="Output quality (1-100)"),
    outputFormat: str = Form("same", description="Output format: same, jpg, png, webp"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Crop images with multiple modes
    
    **Crop Modes:**
    
    1. **pixels**: Exact pixel coordinates
       - x, y: Top-left position
       - width, height: Crop dimensions
    
    2. **percentage**: Percentage-based crop
       - x, y: Position as percentage
       - width, height: Size as percentage
    
    3. **center**: Center crop
       - width, height: Desired dimensions
       - Automatically centers
    
    4. **smart**: Aspect ratio crop
       - aspect_ratio: Target ratio (e.g., '16:9')
       - Automatically calculates best crop
    
    **Aspect Ratios:**
    - 16:9 (Widescreen)
    - 4:3 (Standard)
    - 1:1 (Square/Instagram)
    - 3:2 (Photography)
    - 21:9 (Ultrawide)
    
    **Supported Formats:** JPG, PNG, WebP, GIF, BMP
    """
    
    try:
        # Validate image
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if mode not in ['pixels', 'percentage', 'center', 'smart']:
            raise HTTPException(status_code=400, detail="Invalid mode")
        
        # Save uploaded file
        input_ext = file.filename.split('.')[-1].lower()
        input_file = temp_manager.create_temp_file(suffix=f"_input.{input_ext}")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix=f"_cropped.{input_ext}")
        
        # Determine mode based on aspect ratio
        mode = 'smart' if aspectRatio != 'free' else 'pixels'
        
        # Determine output format
        out_format = input_ext.upper() if outputFormat == 'same' else outputFormat.upper()
        if out_format == 'JPG':
            out_format = 'JPEG'
        
        # Crop options with all settings
        options = {
            'mode': mode,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'aspect_ratio': aspectRatio if aspectRatio != 'free' else None,
            'rotation': rotation,
            'flip_horizontal': flipH,
            'flip_vertical': flipV,
            'zoom': zoom,
            'auto_enhance': autoEnhance,
            'sharpen': sharpen,
            'quality': quality,
            'format': out_format
        }
        
        ImageProcessor.crop_image_advanced(input_file, output_file, options)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_cropped.{input_ext}"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crop failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Crop Image",
        "description": "Crop images with multiple modes",
        "features": [
            "4 crop modes",
            "Pixel-perfect cropping",
            "Aspect ratio support",
            "Center crop",
            "Smart crop",
            "All formats supported"
        ],
        "crop_modes": {
            "pixels": "Exact pixel coordinates",
            "percentage": "Percentage-based",
            "center": "Automatic center crop",
            "smart": "Aspect ratio based"
        },
        "common_ratios": {
            "16:9": "Widescreen",
            "4:3": "Standard",
            "1:1": "Square",
            "3:2": "Photography",
            "21:9": "Ultrawide"
        },
        "options": {
            "mode": "string - Crop mode",
            "x": "int - X position (pixels mode)",
            "y": "int - Y position (pixels mode)",
            "width": "int - Crop width",
            "height": "int - Crop height",
            "aspect_ratio": "string - Aspect ratio (smart mode)",
            "output_filename": "string - Output filename"
        }
    }
