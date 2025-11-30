"""
Split PDF Tool Endpoint
Split PDF into multiple files with flexible options
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional, List
import json
import zipfile
import io

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.pdf_processor import PDFProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/split-pdf", tags=["PDF Tools"])

@router.post("")
async def split_pdf(
    file: UploadFile = File(..., description="PDF file to split"),
    mode: str = Form("pages", description="Split mode: 'pages', 'ranges', or 'every_n'"),
    pages: Optional[str] = Form(None, description="Comma-separated page numbers (for 'pages' mode)"),
    ranges: Optional[str] = Form(None, description="Page ranges as JSON array [[start, end], ...]"),
    every_n: Optional[int] = Form(None, description="Split every N pages (for 'every_n' mode)"),
    preserve_metadata: bool = Form(True, description="Preserve metadata in output files")
):
    """
    Split PDF into multiple files
    
    **Split Modes:**
    1. **pages**: Extract specific pages (e.g., pages="1,3,5")
    2. **ranges**: Extract page ranges (e.g., ranges="[[0,5],[10,15]]")
    3. **every_n**: Split every N pages (e.g., every_n=10)
    
    **Features:**
    - Multiple split modes
    - Preserve or strip metadata
    - Returns ZIP file with all splits
    - Maintains original quality
    
    **Returns:** ZIP file containing all split PDFs
    """
    
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output directory
        output_dir = temp_manager.create_temp_dir(prefix="split_")
        
        # Parse options based on mode
        options = {'mode': mode, 'preserve_metadata': preserve_metadata}
        
        if mode == 'pages':
            if not pages:
                raise HTTPException(status_code=400, detail="'pages' parameter required for 'pages' mode")
            # Parse comma-separated page numbers
            page_list = [int(p.strip()) - 1 for p in pages.split(',')]  # Convert to 0-indexed
            options['pages'] = page_list
        
        elif mode == 'ranges':
            if not ranges:
                raise HTTPException(status_code=400, detail="'ranges' parameter required for 'ranges' mode")
            # Parse JSON ranges
            range_list = json.loads(ranges)
            options['ranges'] = range_list
        
        elif mode == 'every_n':
            if not every_n or every_n < 1:
                raise HTTPException(status_code=400, detail="Valid 'every_n' parameter required")
            options['every_n'] = every_n
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid mode: {mode}")
        
        # Split PDF
        output_files = PDFProcessor.split_pdf(input_file, output_dir, options)
        
        if not output_files:
            raise HTTPException(status_code=500, detail="No files generated")
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for pdf_file in output_files:
                zip_file.write(pdf_file, arcname=pdf_file.name)
        
        zip_buffer.seek(0)
        
        # Return ZIP file
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=split_pdfs.zip"}
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for ranges")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameter: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Split PDF",
        "description": "Split PDF into multiple files",
        "features": [
            "Extract specific pages",
            "Split by page ranges",
            "Split every N pages",
            "Preserve metadata option",
            "Returns ZIP with all files"
        ],
        "modes": {
            "pages": "Extract specific pages (comma-separated)",
            "ranges": "Extract page ranges (JSON array)",
            "every_n": "Split every N pages"
        },
        "options": {
            "mode": "string - Split mode",
            "pages": "string - Page numbers (for 'pages' mode)",
            "ranges": "string - Page ranges JSON (for 'ranges' mode)",
            "every_n": "int - Split interval (for 'every_n' mode)",
            "preserve_metadata": "bool - Keep metadata"
        }
    }
