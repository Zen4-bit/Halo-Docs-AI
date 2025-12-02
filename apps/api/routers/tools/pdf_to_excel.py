"""
PDF to Excel Tool Endpoint
Convert PDF tables to Excel spreadsheet
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.office_processor import OfficeProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/pdf-to-excel", tags=["PDF Tools"])

@router.post("")
async def pdf_to_excel(
    file: UploadFile = File(..., description="PDF file to convert"),
    # Table Extraction
    extractionMode: str = Form("auto", description="Extraction mode: auto, manual"),
    # Cell Handling
    mergeCells: bool = Form(True, description="Merge spanning cells"),
    unwrapText: bool = Form(True, description="Unwrap text in cells"),
    detectNumbers: bool = Form(True, description="Detect number formats"),
    # Output Format
    outputFormat: str = Form("xlsx", description="Output format: xlsx, csv"),
    # Multi-Sheet Options
    separateSheets: bool = Form(False, description="Separate tables into sheets"),
    sheetPerPage: bool = Form(False, description="One sheet per page"),
    # Page Range
    pageRange: str = Form("", description="Page range, e.g. 1-5, 8"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Convert PDF tables to Excel spreadsheet
    
    **Features:**
    - Extract tables from PDF
    - Convert to XLSX or XLS format
    - Multiple sheets for multiple tables
    - Preserves table structure
    
    **Best For:**
    - PDFs with clear table structures
    - Financial reports
    - Data sheets
    - Tabular data
    
    **Note:** Only tables are extracted. This works best with PDFs containing clear table structures.
    
    **Requirements:** tabula-py library must be installed
    """
    
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        if outputFormat.lower() not in ['xlsx', 'csv']:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'xlsx' or 'csv'")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix=f"_output.{outputFormat.lower()}")
        
        # Convert to Excel with all options
        options = {
            'format': outputFormat.lower(),
            'extraction_mode': extractionMode,
            'merge_cells': mergeCells,
            'unwrap_text': unwrapText,
            'detect_numbers': detectNumbers,
            'separate_sheets': separateSheets,
            'sheet_per_page': sheetPerPage,
            'page_range': pageRange
        }
        
        OfficeProcessor.pdf_to_excel(input_file, output_file, options)
        
        # Determine output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "converted"
            output_filename = f"{base_name}.{outputFormat.lower()}"
        
        # Media type mapping
        media_types = {
            'xlsx': "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            'csv': "text/csv"
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
        "name": "PDF to Excel",
        "description": "Convert PDF tables to Excel spreadsheet",
        "features": [
            "Extract tables from PDF",
            "Convert to XLSX or XLS",
            "Multiple sheets support",
            "Preserve table structure",
            "Automatic table detection"
        ],
        "requirements": ["tabula-py and pandas libraries required"],
        "best_for": [
            "PDFs with table structures",
            "Financial reports",
            "Data sheets",
            "Tabular data"
        ],
        "limitations": [
            "Only extracts tables",
            "Best with clear table structures",
            "May need manual adjustment"
        ],
        "options": {
            "format": "string - Output format (xlsx/xls)",
            "output_filename": "string - Output filename"
        }
    }
