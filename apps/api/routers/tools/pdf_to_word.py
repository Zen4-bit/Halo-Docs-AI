"""
PDF to Word Tool Endpoint
Convert PDF to Word document
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.office_processor import OfficeProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/pdf-to-word", tags=["PDF Tools"])

@router.post("")
async def pdf_to_word(
    file: UploadFile = File(..., description="PDF file to convert"),
    # OCR Settings
    enableOcr: bool = Form(False, description="Enable OCR for scanned PDFs"),
    ocrLanguage: str = Form("eng", description="OCR language: eng, deu, fra, spa, ita, por, nld, jpn, kor, chi_sim"),
    deskew: bool = Form(True, description="Deskew scanned pages"),
    # Conversion Mode
    conversionMode: str = Form("preserve", description="Mode: preserve, reflow, plain"),
    # Table Options
    detectTables: bool = Form(True, description="Detect and preserve tables"),
    mergeTableCells: bool = Form(True, description="Merge table cells"),
    # Image Handling
    extractImages: bool = Form(True, description="Extract and include images"),
    imageQuality: int = Form(90, description="Image quality (1-100)"),
    # Cleanup
    removeHeaders: bool = Form(False, description="Remove headers"),
    removeFooters: bool = Form(False, description="Remove footers"),
    removeWatermarks: bool = Form(False, description="Remove watermarks"),
    # Output Format
    outputFormat: str = Form("docx", description="Output format: docx, rtf, txt"),
    # Page Range
    pageRange: str = Form("", description="Page range, e.g. 1-5, 8, 10-12"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Convert PDF to Word document
    
    **Features:**
    - Convert to DOCX or DOC format
    - Preserve formatting option
    - Editable text output
    - Uses LibreOffice for conversion
    
    **Note:** Complex PDFs with images and special formatting may not convert perfectly.
    Best results with text-based PDFs.
    
    **Requirements:** LibreOffice must be installed
    """
    
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if outputFormat.lower() not in ['docx', 'rtf', 'txt']:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'docx', 'rtf', or 'txt'")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix=f"_output.{outputFormat.lower()}")
        
        # Convert to Word with all options
        options = {
            'format': outputFormat.lower(),
            'enable_ocr': enableOcr,
            'ocr_language': ocrLanguage,
            'deskew': deskew,
            'conversion_mode': conversionMode,
            'detect_tables': detectTables,
            'merge_table_cells': mergeTableCells,
            'extract_images': extractImages,
            'image_quality': imageQuality,
            'remove_headers': removeHeaders,
            'remove_footers': removeFooters,
            'remove_watermarks': removeWatermarks,
            'page_range': pageRange
        }
        
        OfficeProcessor.pdf_to_word(input_file, output_file, options)
        
        # Determine output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "converted"
            output_filename = f"{base_name}.{outputFormat.lower()}"
        
        # Media type mapping
        media_types = {
            'docx': "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            'rtf': "application/rtf",
            'txt': "text/plain"
        }
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type=media_types.get(outputFormat.lower(), "application/octet-stream")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "PDF to Word",
        "description": "Convert PDF files to Word documents",
        "features": [
            "Convert to DOCX or DOC",
            "Editable text output",
            "Preserve formatting",
            "LibreOffice-powered"
        ],
        "requirements": ["LibreOffice installation required"],
        "limitations": [
            "Best for text-based PDFs",
            "Complex layouts may need manual adjustment",
            "Images and special formatting may not be perfect"
        ],
        "options": {
            "format": "string - Output format (docx/doc)",
            "preserve_formatting": "bool - Keep original formatting",
            "output_filename": "string - Output filename"
        }
    }
