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
    quality: str = Form("medium", description="Compression quality: 'low', 'medium', 'high', 'max'"),
    remove_metadata: bool = Form(True, description="Remove metadata to reduce size"),
    remove_annotations: bool = Form(False, description="Remove annotations and comments"),
    grayscale: bool = Form(False, description="Convert to grayscale for smaller size"),
    output_filename: Optional[str] = Form("compressed.pdf", description="Output filename")
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
        
        # Compress PDF
        options = {
            'quality': quality,
            'remove_metadata': remove_metadata,
            'remove_annotations': remove_annotations,
            'grayscale': grayscale
        }
        
        PDFProcessor.compress_pdf(input_file, output_file, options)
        
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
