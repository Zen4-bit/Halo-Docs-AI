"""
Image Compressor Tool Endpoint
Compress images with quality control and enhancements
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
    quality: int = Form(80, description="Compression quality (1-100)"),
    outputFormat: Optional[str] = Form(None, description="Output format: png, jpeg, webp, avif"),
    targetSize: int = Form(0, description="Target file size in MB (0 = ignore)"),
    resizePercent: int = Form(100, description="Resize percentage (10-200)"),
    autoEnhance: bool = Form(False, description="Auto enhance image"),
    denoise: bool = Form(False, description="Reduce noise"),
    sharpen: bool = Form(False, description="Sharpen image"),
    brightness: int = Form(0, description="Brightness adjustment (-50 to 50)"),
    contrast: int = Form(0, description="Contrast adjustment (-50 to 50)"),
    removeExif: bool = Form(True, description="Remove EXIF metadata"),
    keepGps: bool = Form(False, description="Keep GPS data if removeExif is false"),
    colorProfile: str = Form("srgb", description="Color profile: srgb, adobe, p3"),
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
        format = outputFormat
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
        
        # Build compression options with all settings
        options = {
            'quality': quality,
            'format': format,
            'progressive': True,
            'optimize': True,
            'strip_metadata': removeExif,
            'keep_gps': keepGps,
            'resize_percent': resizePercent,
            'auto_enhance': autoEnhance,
            'denoise': denoise,
            'sharpen': sharpen,
            'brightness': brightness,
            'contrast': contrast,
            'color_profile': colorProfile,
            'target_size_mb': targetSize
        }
        
        ImageProcessor.compress_image_advanced(input_file, output_file, options)
        
        # If target size is set, iteratively compress until under target
        if targetSize > 0:
            target_bytes = targetSize * 1024 * 1024
            current_quality = quality
            while output_file.stat().st_size > target_bytes and current_quality > 10:
                current_quality -= 10
                options['quality'] = current_quality
                ImageProcessor.compress_image_advanced(input_file, output_file, options)
        
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
