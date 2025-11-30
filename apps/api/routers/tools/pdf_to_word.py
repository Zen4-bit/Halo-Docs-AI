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
    format: str = Form("docx", description="Output format: 'docx' or 'doc'"),
    preserve_formatting: bool = Form(True, description="Preserve original formatting"),
    output_filename: Optional[str] = Form("converted.docx", description="Output filename")
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
        
        if format.lower() not in ['docx', 'doc']:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'docx' or 'doc'")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix=f"_output.{format.lower()}")
        
        # Convert to Word
        options = {
            'format': format.lower(),
            'preserve_formatting': preserve_formatting
        }
        
        OfficeProcessor.pdf_to_word(input_file, output_file, options)
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document" if format.lower() == 'docx' else "application/msword"
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
