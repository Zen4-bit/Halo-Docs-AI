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
    # Split mode
    splitMode: str = Form("pages", description="Split mode: pages, ranges, every_n, size"),
    # Mode-specific options
    pageNumbers: str = Form("", description="Page numbers for 'pages' mode, e.g. 1,3,5"),
    pageRanges: str = Form("", description="Page ranges for 'ranges' mode, e.g. 1-5,8-10"),
    everyN: int = Form(1, description="Split every N pages"),
    maxSizeMB: float = Form(10.0, description="Max file size in MB for 'size' mode"),
    # Output options
    preserveMetadata: bool = Form(True, description="Preserve metadata"),
    preserveBookmarks: bool = Form(True, description="Preserve bookmarks"),
    filenamePattern: str = Form("split_{n}", description="Output filename pattern"),
    # Optimization
    compressOutput: bool = Form(False, description="Compress split files")
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
        options = {
            'mode': splitMode,
            'preserve_metadata': preserveMetadata,
            'preserve_bookmarks': preserveBookmarks,
            'filename_pattern': filenamePattern,
            'compress_output': compressOutput
        }
        
        if splitMode == 'pages':
            if not pageNumbers:
                raise HTTPException(status_code=400, detail="'pageNumbers' parameter required for 'pages' mode")
            page_list = [int(p.strip()) - 1 for p in pageNumbers.split(',')]
            options['pages'] = page_list
        
        elif splitMode == 'ranges':
            if not pageRanges:
                raise HTTPException(status_code=400, detail="'pageRanges' parameter required for 'ranges' mode")
            # Parse ranges like "1-5,8-10"
            range_list = []
            for part in pageRanges.split(','):
                part = part.strip()
                if '-' in part:
                    start, end = part.split('-')
                    range_list.append([int(start) - 1, int(end)])
                else:
                    pg = int(part)
                    range_list.append([pg - 1, pg])
            options['ranges'] = range_list
        
        elif splitMode == 'every_n':
            if everyN < 1:
                raise HTTPException(status_code=400, detail="'everyN' must be at least 1")
            options['every_n'] = everyN
        
        elif splitMode == 'size':
            options['max_size_mb'] = maxSizeMB
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid mode: {splitMode}")
        
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
