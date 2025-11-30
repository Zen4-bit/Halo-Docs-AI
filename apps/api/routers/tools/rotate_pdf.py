"""
Rotate PDF Tool Endpoint
Rotate PDF pages by specified degrees
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/rotate-pdf", tags=["PDF Tools"])

@router.post("")
async def rotate_pdf(
    file: UploadFile = File(..., description="PDF file to rotate"),
    rotation: int = Form(90, description="Rotation angle: 90, 180, 270"),
    pages: str = Form("all", description="Pages to rotate: all, odd, even, or range like 1-5,7,9"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Rotate PDF pages
    
    **Features:**
    - Rotate by 90°, 180°, or 270°
    - Rotate all pages or specific pages
    - Support for page ranges
    
    **Page Selection:**
    - all: All pages
    - odd: Odd pages only (1, 3, 5...)
    - even: Even pages only (2, 4, 6...)
    - Range: 1-5 or 1,3,5,7
    """
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Validate rotation
        if rotation not in [90, 180, 270, -90, -180, -270]:
            raise HTTPException(
                status_code=400, 
                detail="Rotation must be 90, 180, or 270 degrees"
            )
        
        # Normalize rotation
        rotation = rotation % 360
        if rotation == 0:
            rotation = 90
        
        # Read file
        content = await file.read()
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        input_file.write_bytes(content)
        
        output_file = temp_manager.create_temp_file(suffix="_rotated.pdf")
        
        from PyPDF2 import PdfReader, PdfWriter
        
        reader = PdfReader(str(input_file))
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        
        def should_rotate(page_num):
            """Determine if page should be rotated"""
            if pages == "all":
                return True
            elif pages == "odd":
                return page_num % 2 == 1
            elif pages == "even":
                return page_num % 2 == 0
            else:
                # Parse range like "1-5" or "1,3,5"
                try:
                    page_set = set()
                    for part in pages.split(","):
                        part = part.strip()
                        if "-" in part:
                            start, end = part.split("-")
                            page_set.update(range(int(start), int(end) + 1))
                        else:
                            page_set.add(int(part))
                    return page_num in page_set
                except:
                    return True
        
        rotated_count = 0
        
        for page_num, page in enumerate(reader.pages, 1):
            if should_rotate(page_num):
                page.rotate(rotation)
                rotated_count += 1
            writer.add_page(page)
        
        # Write output
        with open(output_file, 'wb') as f:
            writer.write(f)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "document"
            output_filename = f"{base_name}_rotated.pdf"
        
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        response.headers["X-Pages-Rotated"] = str(rotated_count)
        response.headers["X-Total-Pages"] = str(total_pages)
        response.headers["X-Rotation-Degrees"] = str(rotation)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rotation failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Rotate PDF",
        "description": "Rotate PDF pages by specified degrees",
        "features": [
            "Rotate by 90°, 180°, or 270°",
            "Rotate all or specific pages",
            "Page range support",
            "Clockwise rotation"
        ],
        "options": {
            "rotation": "90, 180, or 270 degrees",
            "pages": "all, odd, even, or range like 1-5,7"
        }
    }
