"""
Bulk Resize Tool Endpoint
Resize multiple images at once
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import zipfile
import io

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.image_processor import ImageProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/bulk-resize", tags=["Media Tools"])

@router.post("")
async def bulk_resize(
    files: List[UploadFile] = File(..., description="Multiple image files to resize"),
    width: Optional[int] = Form(None, description="Target width"),
    height: Optional[int] = Form(None, description="Target height"),
    mode: str = Form("fit", description="Resize mode: fit, fill, stretch, thumbnail"),
    maintain_aspect: bool = Form(True, description="Maintain aspect ratio"),
    quality: int = Form(90, description="Output quality (1-100)"),
    format: Optional[str] = Form(None, description="Convert to format (jpg, png, webp)")
):
    """
    Resize multiple images at once
    
    **Features:**
    - Process multiple images
    - Same settings for all
    - Format conversion option
    - Returns ZIP with all resized images
    - Fast batch processing
    
    **Perfect For:**
    - Resizing photo galleries
    - Preparing images for web
    - Bulk social media prep
    - Creating thumbnails
    - Batch image optimization
    
    **Supported Formats:** JPG, PNG, WebP, GIF, BMP, TIFF
    
    **Returns:** ZIP file containing all resized images
    
    **Note:** Maximum 50 images per request
    """
    
    try:
        # Validate inputs
        if len(files) == 0:
            raise HTTPException(status_code=400, detail="No files provided")
        
        if len(files) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 images allowed per request")
        
        if not width and not height:
            raise HTTPException(status_code=400, detail="Must specify at least width or height")
        
        if mode not in ['fit', 'fill', 'stretch', 'thumbnail']:
            raise HTTPException(status_code=400, detail="Invalid resize mode")
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        if format and format.lower() not in ['jpg', 'jpeg', 'png', 'webp']:
            raise HTTPException(status_code=400, detail="Invalid format. Use jpg, png, or webp")
        
        # Create output directory
        output_dir = temp_manager.create_temp_dir(prefix="bulk_resize_")
        resized_files = []
        
        # Process each image
        for idx, file in enumerate(files):
            try:
                # Validate image
                is_valid, error = await FileValidator.validate_image(file)
                if not is_valid:
                    # Skip invalid files
                    continue
                
                # Determine extensions
                input_ext = file.filename.split('.')[-1].lower()
                output_ext = format.lower() if format else input_ext
                if output_ext == 'jpeg':
                    output_ext = 'jpg'
                
                # Save input file
                input_file = temp_manager.create_temp_file(suffix=f"_input_{idx}.{input_ext}")
                content = await file.read()
                input_file.write_bytes(content)
                
                # Create output file
                base_name = file.filename.rsplit('.', 1)[0]
                output_filename = f"{base_name}_resized.{output_ext}"
                output_file = output_dir / output_filename
                
                # Resize options
                options = {
                    'width': width,
                    'height': height,
                    'mode': mode,
                    'maintain_aspect': maintain_aspect,
                    'quality': quality
                }
                
                if format:
                    options['format'] = format.upper()
                
                # Resize image
                ImageProcessor.resize_image(input_file, output_file, options)
                resized_files.append(output_file)
                
            except Exception as e:
                # Skip failed images
                continue
        
        if not resized_files:
            raise HTTPException(status_code=500, detail="No images were successfully resized")
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for img_file in resized_files:
                zip_file.write(img_file, arcname=img_file.name)
        
        zip_buffer.seek(0)
        
        # Return ZIP file
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=resized_images.zip",
                "X-Images-Processed": str(len(resized_files)),
                "X-Images-Total": str(len(files))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk resize failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Bulk Resize",
        "description": "Resize multiple images at once",
        "features": [
            "Process up to 50 images",
            "Same settings for all",
            "Format conversion",
            "ZIP archive output",
            "Fast batch processing",
            "Skip invalid files"
        ],
        "limits": {
            "max_files": 50,
            "max_file_size": "50MB per image"
        },
        "best_for": [
            "Photo galleries",
            "Web optimization",
            "Social media prep",
            "Thumbnail creation",
            "Batch optimization"
        ],
        "options": {
            "files": "array - Multiple image files (max 50)",
            "width": "int - Target width",
            "height": "int - Target height",
            "mode": "string - Resize mode",
            "maintain_aspect": "bool - Keep aspect ratio",
            "quality": "int - Output quality (1-100)",
            "format": "string - Convert to format (optional)"
        }
    }
