"""
PNG Compressor Tool Endpoint
Specialized PNG compression
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/png-compressor", tags=["Media Tools"])

@router.post("")
async def compress_png(
    file: UploadFile = File(..., description="PNG file to compress"),
    compressionLevel: int = Form(9, description="Compression level (1-9)"),
    targetSize: int = Form(0, description="Target file size in KB (0 = ignore)"),
    resizePercent: int = Form(100, description="Resize percentage (10-200)"),
    preserveTransparency: bool = Form(True, description="Preserve transparency"),
    reduceColors: bool = Form(False, description="Reduce color palette"),
    colorCount: int = Form(256, description="Max colors if reducing (2-256)"),
    interlaced: bool = Form(False, description="Interlaced PNG"),
    stripMetadata: bool = Form(True, description="Remove metadata"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Specialized PNG compression
    
    **Features:**
    - Lossless compression
    - Maintain transparency
    - Strip metadata
    - Optimize color palette
    - High compression ratio
    
    **Best For:**
    - Screenshots
    - Graphics with transparency
    - Logos
    - Icons
    - Diagrams
    
    **Note:** PNG compression is lossless, so quality setting affects optimization level, not visual quality
    """
    
    try:
        # Validate PNG
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Check if actually PNG
        content = await file.read()
        await file.seek(0)
        
        if not content.startswith(b'\x89PNG'):
            raise HTTPException(status_code=400, detail="File is not a valid PNG")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.png")
        input_file.write_bytes(content)
        original_size = len(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_compressed.png")
        
        # Compress PNG with all options
        options = {
            'compression_level': compressionLevel,
            'format': 'PNG',
            'optimize': True,
            'strip_metadata': stripMetadata,
            'preserve_transparency': preserveTransparency,
            'reduce_colors': reduceColors,
            'color_count': colorCount,
            'interlaced': interlaced,
            'resize_percent': resizePercent,
            'target_size_kb': targetSize
        }
        
        ImageProcessor.compress_image_advanced(input_file, output_file, options)
        
        # If target size is set, iteratively compress
        if targetSize > 0:
            target_bytes = targetSize * 1024
            current_level = compressionLevel
            while output_file.stat().st_size > target_bytes and current_level < 9:
                current_level += 1
                options['compression_level'] = current_level
                ImageProcessor.compress_image_advanced(input_file, output_file, options)
        
        # Calculate compression
        compressed_size = output_file.stat().st_size
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_compressed.png"
        
        # Return file
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/png"
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
        "name": "PNG Compressor",
        "description": "Specialized PNG compression with transparency preservation",
        "features": [
            "Lossless compression",
            "Preserve transparency",
            "Strip metadata",
            "Optimize palette",
            "High compression ratio"
        ],
        "best_for": [
            "Screenshots",
            "Logos with transparency",
            "Icons",
            "Graphics",
            "Diagrams"
        ],
        "options": {
            "quality": "int - Optimization level (1-100)",
            "strip_metadata": "bool - Remove metadata",
            "output_filename": "string - Output filename"
        }
    }
