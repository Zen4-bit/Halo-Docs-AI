"""
Image Compressor Tool Endpoint
Compress images with quality control
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/image-compressor", tags=["Media Tools"])

@router.post("")
async def compress_image(
    file: UploadFile = File(..., description="Image file to compress"),
    quality: int = Form(85, description="Compression quality (1-100)"),
    format: Optional[str] = Form(None, description="Output format: png, jpg, webp (default: same as input)"),
    max_width: Optional[int] = Form(None, description="Maximum width (resize if larger)"),
    max_height: Optional[int] = Form(None, description="Maximum height (resize if larger)"),
    progressive: bool = Form(True, description="Progressive JPEG (for jpg)"),
    strip_metadata: bool = Form(True, description="Remove EXIF data"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Compress images with quality control
    
    **Supported Formats:**
    - JPEG/JPG
    - PNG
    - WebP
    - GIF
    - BMP
    - TIFF
    
    **Features:**
    - Quality control (1-100)
    - Format conversion
    - Resize option
    - Strip metadata
    - Progressive JPEG
    - Optimize file size
    
    **Quality Recommendations:**
    - 90-100: Minimal compression
    - 80-90: High quality (recommended)
    - 70-80: Good quality, smaller size
    - 50-70: Medium quality
    - Below 50: Low quality, very small
    """
    
    try:
        # Validate image
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Determine output format
        if not format:
            format = file.filename.split('.')[-1].lower()
        format = format.upper() if format.lower() in ['jpeg', 'jpg'] else format.upper()
        
        # Save uploaded file
        input_ext = file.filename.split('.')[-1].lower()
        input_file = temp_manager.create_temp_file(suffix=f"_input.{input_ext}")
        content = await file.read()
        original_size = len(content)
        input_file.write_bytes(content)
        
        # Create output file
        output_ext = format.lower() if format.lower() != 'jpeg' else 'jpg'
        output_file = temp_manager.create_temp_file(suffix=f"_compressed.{output_ext}")
        
        # Compress image
        options = {
            'quality': quality,
            'format': format,
            'progressive': progressive,
            'optimize': True,
            'max_width': max_width,
            'max_height': max_height,
            'strip_metadata': strip_metadata
        }
        
        ImageProcessor.compress_image(input_file, output_file, options)
        
        # Calculate compression ratio
        compressed_size = output_file.stat().st_size
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        # Determine output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_compressed.{output_ext}"
        
        # Return file with stats
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename
        )
        response.headers["X-Original-Size"] = str(original_size)
        response.headers["X-Compressed-Size"] = str(compressed_size)
        response.headers["X-Compression-Ratio"] = f"{compression_ratio:.1f}%"
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Image Compressor",
        "description": "Compress images with quality control",
        "features": [
            "Multiple format support",
            "Quality control (1-100)",
            "Format conversion",
            "Auto resize option",
            "Strip metadata",
            "Progressive JPEG",
            "Optimize file size"
        ],
        "supported_formats": ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"],
        "options": {
            "quality": "int - Compression quality (1-100)",
            "format": "string - Output format",
            "max_width": "int - Maximum width",
            "max_height": "int - Maximum height",
            "progressive": "bool - Progressive JPEG",
            "strip_metadata": "bool - Remove EXIF",
            "output_filename": "string - Output filename"
        }
    }
