"""
GIF Compressor Tool Endpoint
Specialized GIF compression
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/gif-compressor", tags=["Media Tools"])

@router.post("")
async def compress_gif(
    file: UploadFile = File(..., description="GIF file to compress"),
    quality: int = Form(85, description="Compression quality (1-100)"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Specialized GIF compression
    
    **Features:**
    - Preserve animation
    - Reduce file size
    - Maintain transparency
    - Optimize color palette
    - Fast processing
    
    **Best For:**
    - Animated GIFs
    - Simple animations
    - Memes
    - Graphics with few colors
    
    **Note:** GIF compression maintains animation frames while reducing file size
    """
    
    try:
        # Validate GIF
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.gif")
        content = await file.read()
        original_size = len(content)
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_compressed.gif")
        
        # Compress GIF
        options = {
            'quality': quality,
            'format': 'GIF',
            'optimize': True
        }
        
        ImageProcessor.compress_image(input_file, output_file, options)
        
        # Calculate compression
        compressed_size = output_file.stat().st_size
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0]
            output_filename = f"{base_name}_compressed.gif"
        
        # Return file
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/gif"
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
        "name": "GIF Compressor",
        "description": "Compress animated GIFs while preserving animation",
        "features": [
            "Preserve animation",
            "Reduce file size",
            "Maintain transparency",
            "Optimize palette",
            "Fast processing"
        ],
        "best_for": [
            "Animated GIFs",
            "Memes",
            "Simple animations",
            "Low-color graphics"
        ],
        "options": {
            "quality": "int - Optimization level (1-100)",
            "output_filename": "string - Output filename"
        }
    }
