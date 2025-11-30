"""
Excel to PDF Tool Endpoint
Convert Excel spreadsheets to PDF
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.office_processor import OfficeProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/excel-to-pdf", tags=["Office Tools"])

@router.post("")
async def excel_to_pdf(
    file: UploadFile = File(..., description="Excel file to convert (.xls or .xlsx)"),
    landscape: bool = Form(False, description="Use landscape orientation"),
    fit_to_page: bool = Form(True, description="Fit content to page"),
    output_filename: Optional[str] = Form("converted.pdf", description="Output filename")
):
    """
    Convert Excel spreadsheet to PDF
    
    **Supported Formats:**
    - XLSX (Excel 2007+)
    - XLS (Excel 97-2003)
    
    **Features:**
    - All sheets converted
    - Portrait or landscape
    - Fit to page option
    - Preserve formatting
    - Professional layout
    
    **Note:** Large spreadsheets may be split across multiple pages
    
    **Uses LibreOffice** for conversion
    """
    
    try:
        # Validate Excel file
        is_valid, error = await FileValidator.validate_office(file, 'excel')
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
            'landscape': landscape,
            'fit_to_page': fit_to_page
        }
        
        OfficeProcessor.excel_to_pdf(input_file, output_file, options)
        
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
        "name": "Excel to PDF",
        "description": "Convert Excel spreadsheets to PDF",
        "features": [
            "Supports XLS and XLSX",
            "All sheets converted",
            "Portrait or landscape",
            "Fit to page option",
            "Preserve formatting",
            "Professional output"
        ],
        "supported_formats": ["xls", "xlsx"],
        "requirements": ["LibreOffice installation required"],
        "options": {
            "landscape": "bool - Landscape orientation",
            "fit_to_page": "bool - Fit content to page",
            "output_filename": "string - Output filename"
        }
    }
