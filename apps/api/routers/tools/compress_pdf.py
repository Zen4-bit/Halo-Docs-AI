"""
Compress PDF Tool Endpoint
Reduce PDF file size with quality control
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.pdf_processor import PDFProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/compress-pdf", tags=["PDF Tools"])

@router.post("")
async def compress_pdf(
    file: UploadFile = File(..., description="PDF file to compress"),
    # Compression level
    compressionLevel: str = Form("medium", description="Compression level: low, medium, high, maximum"),
    targetSize: int = Form(0, description="Target file size in KB (0 = ignore)"),
    # Image options
    imageQuality: int = Form(80, description="Image quality (1-100)"),
    downsampleImages: bool = Form(True, description="Downsample high-res images"),
    maxImageDpi: int = Form(150, description="Max image DPI"),
    # Content removal
    removeMetadata: bool = Form(True, description="Remove metadata"),
    removeAnnotations: bool = Form(False, description="Remove annotations"),
    removeBookmarks: bool = Form(False, description="Remove bookmarks"),
    removeForms: bool = Form(False, description="Flatten form fields"),
    removeJavaScript: bool = Form(True, description="Remove JavaScript"),
    # Color options
    grayscale: bool = Form(False, description="Convert to grayscale"),
    # Optimization
    linearize: bool = Form(True, description="Optimize for web viewing"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Compress PDF file with quality control
    
    **Quality Levels:**
    - **low**: Maximum compression (72 dpi) - smallest size
    - **medium**: Balanced (150 dpi) - recommended
    - **high**: High quality (300 dpi) - larger size
    - **max**: Maximum quality (300 dpi) - minimal compression
    
    **Features:**
    - Multiple quality presets
    - Remove metadata for extra space
    - Grayscale conversion option
    - Remove annotations option
    - Uses Ghostscript for best results
    
    **Typical Size Reduction:** 40-70% depending on settings
    """
    
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_size = len(content)
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_compressed.pdf")
        
        # Compress PDF with all options
        options = {
            'compression_level': compressionLevel,
            'target_size_kb': targetSize,
            'image_quality': imageQuality,
            'downsample_images': downsampleImages,
            'max_image_dpi': maxImageDpi,
            'remove_metadata': removeMetadata,
            'remove_annotations': removeAnnotations,
            'remove_bookmarks': removeBookmarks,
            'remove_forms': removeForms,
            'remove_javascript': removeJavaScript,
            'grayscale': grayscale,
            'linearize': linearize
        }
        
        PDFProcessor.compress_pdf(input_file, output_file, options)
        
        # Determine output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "document"
            output_filename = f"{base_name}_compressed.pdf"
        
        # Calculate compression ratio
        output_size = output_file.stat().st_size
        compression_ratio = ((input_size - output_size) / input_size) * 100
        
        # Return file with compression stats in headers
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        response.headers["X-Original-Size"] = str(input_size)
        response.headers["X-Compressed-Size"] = str(output_size)
        response.headers["X-Compression-Ratio"] = f"{compression_ratio:.1f}%"
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Compress PDF",
        "description": "Reduce PDF file size with quality control",
        "features": [
            "Multiple quality presets",
            "Ghostscript-powered compression",
            "Metadata removal",
            "Grayscale conversion",
            "40-70% size reduction",
            "Maintains readability"
        ],
        "quality_levels": {
            "low": "72 dpi - Maximum compression",
            "medium": "150 dpi - Balanced (recommended)",
            "high": "300 dpi - High quality",
            "max": "300 dpi - Minimal compression"
        },
        "options": {
            "quality": "string - Compression level",
            "remove_metadata": "bool - Remove metadata",
            "remove_annotations": "bool - Remove annotations",
            "grayscale": "bool - Convert to grayscale",
            "output_filename": "string - Output filename"
        }
    }
