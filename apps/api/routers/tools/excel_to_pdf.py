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
    # Page Settings
    pageSize: str = Form("a4", description="Page size: a4, letter, legal"),
    orientation: str = Form("portrait", description="Orientation: portrait, landscape"),
    # Scaling
    fitToPage: bool = Form(True, description="Fit content to page"),
    scalingPercent: int = Form(100, description="Scaling percentage (10-400)"),
    fitToWidth: bool = Form(False, description="Fit to width only"),
    # Sheet Options
    allSheets: bool = Form(True, description="Convert all sheets"),
    sheetSelection: str = Form("", description="Sheet numbers if not all, e.g. 1,2,3"),
    oneSheetPerPage: bool = Form(True, description="One sheet per page"),
    # Content Options
    includeGridlines: bool = Form(False, description="Include gridlines"),
    includeHeaders: bool = Form(True, description="Include row/column headers"),
    repeatHeaders: bool = Form(True, description="Repeat headers on each page"),
    # Margins
    marginTop: float = Form(0.75, description="Top margin in inches"),
    marginBottom: float = Form(0.75, description="Bottom margin in inches"),
    marginLeft: float = Form(0.5, description="Left margin in inches"),
    marginRight: float = Form(0.5, description="Right margin in inches"),
    output_filename: Optional[str] = Form(None, description="Output filename")
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
        
        # Convert to PDF with all options
        options = {
            'page_size': pageSize,
            'orientation': orientation,
            'fit_to_page': fitToPage,
            'scaling_percent': scalingPercent,
            'fit_to_width': fitToWidth,
            'all_sheets': allSheets,
            'sheet_selection': sheetSelection,
            'one_sheet_per_page': oneSheetPerPage,
            'include_gridlines': includeGridlines,
            'include_headers': includeHeaders,
            'repeat_headers': repeatHeaders,
            'margin_top': marginTop,
            'margin_bottom': marginBottom,
            'margin_left': marginLeft,
            'margin_right': marginRight
        }
        
        OfficeProcessor.excel_to_pdf(input_file, output_file, options)
        
        # Determine output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "spreadsheet"
            output_filename = f"{base_name}.pdf"
        
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
