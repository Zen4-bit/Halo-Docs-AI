"""
WebP Compressor Tool Endpoint
Specialized WebP compression
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/webp-compressor", tags=["Media Tools"])

@router.post("")
async def compress_webp(
    file: UploadFile = File(..., description="WebP file to compress"),
    quality: int = Form(85, description="Compression quality (1-100)"),
    strip_metadata: bool = Form(True, description="Remove metadata"),
    lossless: bool = Form(False, description="Use lossless compression"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Specialized WebP compression
    
    **Features:**
    - Lossy and lossless compression
    - Quality control
    - Metadata removal
    - Excellent compression ratios
    
    **Best For:**
    - Web images
    - Modern browsers
    - Replacing PNG/JPEG
    - Transparency support
    
    **Note:** WebP offers superior compression compared to PNG and JPEG
    """
    try:
        # Validate image
        is_valid, error = await FileValidator.validate_image(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Read content
        content = await file.read()
        await file.seek(0)
        
        # Check if WebP (RIFF....WEBP header)
        if not (content[:4] == b'RIFF' and content[8:12] == b'WEBP'):
            raise HTTPException(status_code=400, detail="File is not a valid WebP image")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.webp")
        input_file.write_bytes(content)
        original_size = len(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_compressed.webp")
        
        # Compress WebP
        from PIL import Image
        
        with Image.open(input_file) as img:
            # Preserve transparency if present
            if img.mode in ('RGBA', 'LA', 'PA'):
                # Keep alpha channel
                pass
            elif img.mode == 'P':
                # Convert palette to RGBA if has transparency
                if 'transparency' in img.info:
                    img = img.convert('RGBA')
            
            # Save with compression
            save_kwargs = {
                'quality': quality,
                'method': 6,  # Best compression method
            }
            
            if lossless:
                save_kwargs['lossless'] = True
            
            if strip_metadata:
                # Remove EXIF by creating new image
                data = list(img.getdata())
                img_clean = Image.new(img.mode, img.size)
                img_clean.putdata(data)
                img_clean.save(output_file, 'WEBP', **save_kwargs)
            else:
                img.save(output_file, 'WEBP', **save_kwargs)
        
        # Calculate compression
        compressed_size = output_file.stat().st_size
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "image"
            output_filename = f"{base_name}_compressed.webp"
        
        # Return file
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="image/webp"
        )
        response.headers["X-Original-Size"] = str(original_size)
        response.headers["X-Compressed-Size"] = str(compressed_size)
        response.headers["X-Compression-Ratio"] = f"{compression_ratio:.1f}%"
        response.headers["X-Compression-Mode"] = "lossless" if lossless else "lossy"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "WebP Compressor",
        "description": "Specialized WebP compression",
        "features": [
            "Lossy and lossless modes",
            "Superior compression",
            "Transparency support",
            "Metadata removal",
            "Quality control"
        ],
        "best_for": [
            "Web images",
            "Modern browsers",
            "Replacing PNG/JPEG",
            "Animation support"
        ],
        "options": {
            "quality": "int - Quality level (1-100)",
            "lossless": "bool - Lossless compression",
            "strip_metadata": "bool - Remove metadata",
            "output_filename": "string - Output filename"
        }
    }
