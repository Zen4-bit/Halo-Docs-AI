"""
JPEG Compressor Tool Endpoint
Specialized JPEG compression
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/jpeg-compressor", tags=["Media Tools"])

@router.post("")
async def compress_jpeg(
    file: UploadFile = File(..., description="JPEG file to compress"),
    quality: int = Form(85, description="Compression quality (1-100)"),
    progressive: bool = Form(True, description="Progressive JPEG"),
    strip_metadata: bool = Form(True, description="Remove EXIF data"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Specialized JPEG compression
    
    **Features:**
    - Quality control
    - Progressive encoding
    - Strip EXIF data
    - Optimize file size
    - Maintain aspect ratio
    
    **Quality Guide:**
    - 90-100: High quality, large file
    - 80-90: Good quality (recommended)
    - 70-80: Medium quality
    - 50-70: Lower quality, smaller file
    - Below 50: Very compressed
    
    **Progressive JPEG:**
    - Loads in layers (better for web)
    - Slightly larger file
    - Better user experience
    
    **Best For:**
    - Photographs
    - Web images
    - Social media
    - Email attachments
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
        original_size = len(content)
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_compressed.jpg")
        
        # Compress JPEG
        options = {
            'quality': quality,
            'format': 'JPEG',
            'progressive': progressive,
            'optimize': True,
            'strip_metadata': strip_metadata
        }
        
        ImageProcessor.compress_image(input_file, output_file, options)
        
        # Calculate compression
        compressed_size = output_file.stat().st_size
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_compressed.jpg"
        
        # Return file
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/jpeg"
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
        "name": "JPEG Compressor",
        "description": "Specialized JPEG compression for photos",
        "features": [
            "Quality control (1-100)",
            "Progressive encoding",
            "Strip EXIF data",
            "Optimize file size",
            "Fast processing"
        ],
        "best_for": [
            "Photographs",
            "Web images",
            "Social media",
            "Email attachments"
        ],
        "quality_guide": {
            "90-100": "High quality, large file",
            "80-90": "Good quality (recommended)",
            "70-80": "Medium quality",
            "50-70": "Lower quality, smaller",
            "below_50": "Very compressed"
        },
        "options": {
            "quality": "int - Compression quality (1-100)",
            "progressive": "bool - Progressive encoding",
            "strip_metadata": "bool - Remove EXIF",
            "output_filename": "string - Output filename"
        }
    }
