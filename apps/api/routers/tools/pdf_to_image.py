"""
PDF to Image Tool Endpoint
Convert PDF pages to image files
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import zipfile
import io

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.pdf_processor import PDFProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/pdf-to-image", tags=["PDF Tools"])

@router.post("")
async def pdf_to_image(
    file: UploadFile = File(..., description="PDF file to convert"),
    # Output Format
    outputFormat: str = Form("png", description="Output format: png, jpg, webp"),
    dpi: int = Form(150, description="Resolution in DPI (30-600)"),
    quality: int = Form(90, description="Quality (1-100)"),
    # Page Range
    pageRange: str = Form("", description="Page range, e.g. 1-5, 8, 10-12"),
    # Image Enhancements
    autoCrop: bool = Form(False, description="Auto crop whitespace"),
    deskew: bool = Form(False, description="Deskew scanned pages"),
    sharpen: bool = Form(False, description="Sharpen image"),
    denoise: bool = Form(False, description="Reduce noise"),
    grayscale: bool = Form(False, description="Convert to grayscale"),
    # Resize
    resizePercent: int = Form(100, description="Resize percentage (10-200)")
):
    """
    Convert PDF pages to image files
    
    **Features:**
    - Convert to PNG, JPEG, or WebP
    - Adjustable DPI (resolution)
    - Quality control for JPEG
    - Convert specific pages or all
    - Returns ZIP with all images
    
    **Supported Formats:**
    - **PNG**: Lossless, best for text
    - **JPG**: Compressed, smaller size
    - **WebP**: Modern format, good balance
    
    **DPI Recommendations:**
    - 72-150: Web viewing
    - 300: Print quality (recommended)
    - 600: High-quality print
    
    **Returns:** ZIP file containing all image files
    """
    
    try:
        # Validate inputs
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if outputFormat.lower() not in ['png', 'jpg', 'jpeg', 'webp']:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'png', 'jpg', or 'webp'")
        
        if not 72 <= dpi <= 600:
            raise HTTPException(status_code=400, detail="DPI must be between 72 and 600")
        
        if not 1 <= quality <= 100:
            raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output directory
        output_dir = temp_manager.create_temp_dir(prefix="pdf_images_")
        
        # Parse page range if specified
        page_list = None
        if pageRange:
            try:
                pages_to_convert = []
                for part in pageRange.split(','):
                    part = part.strip()
                    if '-' in part:
                        start, end = part.split('-')
                        pages_to_convert.extend(range(int(start) - 1, int(end)))
                    else:
                        pages_to_convert.append(int(part) - 1)
                page_list = pages_to_convert
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid page range")
        
        # Convert to images with all options
        options = {
            'format': outputFormat.lower(),
            'dpi': dpi,
            'quality': quality,
            'pages': page_list,
            'auto_crop': autoCrop,
            'deskew': deskew,
            'sharpen': sharpen,
            'denoise': denoise,
            'grayscale': grayscale,
            'resize_percent': resizePercent
        }
        
        output_files = PDFProcessor.pdf_to_images(input_file, output_dir, options)
        
        if not output_files:
            raise HTTPException(status_code=500, detail="No images generated")
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for img_file in output_files:
                zip_file.write(img_file, arcname=img_file.name)
        
        zip_buffer.seek(0)
        
        # Return ZIP file
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=pdf_images.zip"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "PDF to Image",
        "description": "Convert PDF pages to image files",
        "features": [
            "Multiple output formats",
            "Adjustable resolution (DPI)",
            "Quality control",
            "Convert specific pages",
            "Batch conversion",
            "ZIP archive output"
        ],
        "formats": {
            "png": "Lossless, best for text and diagrams",
            "jpg": "Compressed, smaller file size",
            "webp": "Modern format, good compression"
        },
        "options": {
            "format": "string - Output format (png/jpg/webp)",
            "dpi": "int - Resolution (72-600)",
            "quality": "int - JPEG quality (1-100)",
            "pages": "string - Specific pages (comma-separated)"
        }
    }
