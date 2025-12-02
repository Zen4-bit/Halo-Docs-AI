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
    colorReduction: int = Form(256, description="Max colors (2-256)"),
    targetSize: int = Form(0, description="Target file size in KB (0 = ignore)"),
    resizePercent: int = Form(100, description="Resize percentage (10-200)"),
    preserveTransparency: bool = Form(True, description="Preserve transparency"),
    reduceFrames: bool = Form(False, description="Reduce animation frames"),
    frameSkip: int = Form(2, description="Keep every Nth frame"),
    optimizePalette: bool = Form(True, description="Optimize color palette"),
    dithering: bool = Form(True, description="Apply dithering"),
    loopCount: int = Form(0, description="Loop count (0 = infinite)"),
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
        
        # Compress GIF with all options
        from PIL import Image
        
        with Image.open(input_file) as img:
            frames = []
            durations = []
            
            try:
                # Extract all frames
                frame_count = 0
                while True:
                    frame = img.copy()
                    
                    # Skip frames if reducing
                    if reduceFrames and frame_count % frameSkip != 0:
                        frame_count += 1
                        img.seek(img.tell() + 1)
                        continue
                    
                    # Resize if needed
                    if resizePercent != 100:
                        new_width = int(frame.width * resizePercent / 100)
                        new_height = int(frame.height * resizePercent / 100)
                        frame = frame.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    # Reduce colors
                    if colorReduction < 256:
                        if dithering:
                            frame = frame.quantize(colors=colorReduction, dither=Image.Dither.FLOYDSTEINBERG)
                        else:
                            frame = frame.quantize(colors=colorReduction, dither=Image.Dither.NONE)
                    
                    frames.append(frame)
                    durations.append(img.info.get('duration', 100))
                    frame_count += 1
                    img.seek(img.tell() + 1)
            except EOFError:
                pass
            
            if frames:
                # Save optimized GIF
                frames[0].save(
                    output_file,
                    format='GIF',
                    save_all=True,
                    append_images=frames[1:] if len(frames) > 1 else [],
                    duration=durations,
                    loop=loopCount,
                    optimize=optimizePalette
                )
            else:
                # Single frame
                img.save(output_file, format='GIF', optimize=optimizePalette)
        
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
