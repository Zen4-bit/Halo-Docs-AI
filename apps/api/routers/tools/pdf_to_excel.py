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
    format: str = Form("xlsx", description="Output format: 'xlsx' or 'xls'"),
    output_filename: Optional[str] = Form("converted.xlsx", description="Output filename")
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
        
        if format.lower() not in ['xlsx', 'xls']:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'xlsx' or 'xls'")
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix=f"_output.{format.lower()}")
        
        # Convert to Excel
        options = {'format': format.lower()}
        
        OfficeProcessor.pdf_to_excel(input_file, output_file, options)
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format.lower() == 'xlsx' else "application/vnd.ms-excel"
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
