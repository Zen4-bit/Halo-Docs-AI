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
    quality: int = Form(90, description="Compression quality (1-100)"),
    strip_metadata: bool = Form(True, description="Remove metadata"),
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
        
        # Compress PNG
        options = {
            'quality': quality,
            'format': 'PNG',
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
