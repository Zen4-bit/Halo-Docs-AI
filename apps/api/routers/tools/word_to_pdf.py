"""
Word to PDF Tool Endpoint
Convert Word documents to PDF
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.office_processor import OfficeProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/word-to-pdf", tags=["Office Tools"])

@router.post("")
async def word_to_pdf(
    file: UploadFile = File(..., description="Word document to convert (.doc or .docx)"),
    preserve_links: bool = Form(True, description="Preserve hyperlinks"),
    preserve_bookmarks: bool = Form(True, description="Preserve bookmarks"),
    output_filename: Optional[str] = Form("converted.pdf", description="Output filename")
):
    """
    Convert Word document to PDF
    
    **Supported Formats:**
    - DOCX (Word 2007+)
    - DOC (Word 97-2003)
    
    **Features:**
    - High-quality conversion
    - Preserve hyperlinks
    - Preserve bookmarks
    - Maintain formatting
    - Professional output
    
    **Uses LibreOffice** for reliable conversion
    """
    
    try:
        # Validate Word document
        is_valid, error = await FileValidator.validate_office(file, 'word')
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Save uploaded file
        ext = file.filename.split('.')[-1].lower()
        input_file = temp_manager.create_temp_file(suffix=f"_input.{ext}")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_output.pdf")
        
        # Convert to PDF
        options = {
            'preserve_links': preserve_links,
            'preserve_bookmarks': preserve_bookmarks
        }
        
        OfficeProcessor.word_to_pdf(input_file, output_file, options)
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Word to PDF",
        "description": "Convert Word documents to PDF",
        "features": [
            "Supports DOC and DOCX",
            "High-quality conversion",
            "Preserve hyperlinks",
            "Preserve bookmarks",
            "Maintain formatting",
            "LibreOffice-powered"
        ],
        "supported_formats": ["doc", "docx"],
        "requirements": ["LibreOffice installation required"],
        "options": {
            "preserve_links": "bool - Keep hyperlinks",
            "preserve_bookmarks": "bool - Keep bookmarks",
            "output_filename": "string - Output filename"
        }
    }
