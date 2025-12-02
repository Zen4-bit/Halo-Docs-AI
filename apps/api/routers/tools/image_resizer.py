"""
Image Resizer Tool Endpoint
Universal image resizing
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/image-resizer", tags=["Media Tools"])

@router.post("")
async def resize_image(
    file: UploadFile = File(..., description="Image file to resize"),
    width: Optional[int] = Form(None, description="Target width"),
    height: Optional[int] = Form(None, description="Target height"),
    resizeMode: str = Form("fit", description="Resize mode: fit, fill, stretch, exact"),
    maintainAspect: bool = Form(True, description="Maintain aspect ratio"),
    upscale: bool = Form(True, description="Allow upscaling"),
    quality: int = Form(90, description="Output quality (1-100)"),
    # Enhancement options
    sharpen: bool = Form(False, description="Sharpen after resize"),
    autoEnhance: bool = Form(False, description="Auto enhance"),
    denoise: bool = Form(False, description="Reduce noise"),
    # Output options
    outputFormat: str = Form("same", description="Output format: same, jpg, png, webp"),
    stripMetadata: bool = Form(True, description="Remove EXIF data"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Resize images with multiple modes
    
    **Resize Modes:**
    
    1. **fit**: Fit inside bounds (default)
       - Maintains aspect ratio
       - Image fits within specified dimensions
       - No cropping
    
    2. **fill**: Fill bounds exactly
       - Maintains aspect ratio
       - Crops if necessary to fill
       - No empty space
    
    3. **stretch**: Stretch to exact size
       - Ignores aspect ratio
       - Matches dimensions exactly
       - May distort image
    
    4. **thumbnail**: Create thumbnail
       - Maintains aspect ratio
       - Never upscales
       - Perfect for previews
    
    **Options:**
    - Specify width, height, or both
    - Control upscaling
    - Maintain aspect ratio
    - Quality control
    
    **Supported Formats:** JPG, PNG, WebP, GIF, BMP, TIFF
    """
    
    try:
        # Validate image
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not width and not height:
            raise HTTPException(status_code=400, detail="Must specify at least width or height")
        
        if mode not in ['fit', 'fill', 'stretch', 'thumbnail']:
            raise HTTPException(status_code=400, detail="Invalid resize mode")
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_ext = file.filename.split('.')[-1].lower()
        input_file = temp_manager.create_temp_file(suffix=f"_input.{input_ext}")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Get original dimensions
        original_info = ImageProcessor.get_image_info(input_file)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix=f"_resized.{input_ext}")
        
        # Determine output format
        out_format = input_ext.upper() if outputFormat == 'same' else outputFormat.upper()
        if out_format == 'JPG':
            out_format = 'JPEG'
        
        # Resize options with all settings
        options = {
            'width': width,
            'height': height,
            'mode': resizeMode,
            'maintain_aspect': maintainAspect,
            'upscale': upscale,
            'quality': quality,
            'sharpen': sharpen,
            'auto_enhance': autoEnhance,
            'denoise': denoise,
            'format': out_format,
            'strip_metadata': stripMetadata
        }
        
        ImageProcessor.resize_image_advanced(input_file, output_file, options)
        
        # Get new dimensions
        resized_info = ImageProcessor.get_image_info(output_file)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_resized.{input_ext}"
        
        # Return file with dimension info
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename
        )
        response.headers["X-Original-Width"] = str(original_info['width'])
        response.headers["X-Original-Height"] = str(original_info['height'])
        response.headers["X-New-Width"] = str(resized_info['width'])
        response.headers["X-New-Height"] = str(resized_info['height'])
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resize failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Image Resizer",
        "description": "Resize images with multiple modes",
        "features": [
            "4 resize modes",
            "Maintain aspect ratio",
            "Quality control",
            "Upscale option",
            "All formats supported",
            "Fast processing"
        ],
        "resize_modes": {
            "fit": "Fit inside bounds (no crop)",
            "fill": "Fill bounds (crop if needed)",
            "stretch": "Stretch to exact size",
            "thumbnail": "Create thumbnail (no upscale)"
        },
        "options": {
            "width": "int - Target width",
            "height": "int - Target height",
            "mode": "string - Resize mode",
            "maintain_aspect": "bool - Keep aspect ratio",
            "upscale": "bool - Allow upscaling",
            "quality": "int - Output quality (1-100)",
            "output_filename": "string - Output filename"
        }
    }
