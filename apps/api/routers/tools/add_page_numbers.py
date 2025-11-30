"""
Add Page Numbers Tool Endpoint
Add page numbers to PDF files
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import io

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/add-page-numbers", tags=["PDF Tools"])

@router.post("")
async def add_page_numbers(
    file: UploadFile = File(..., description="PDF file"),
    position: str = Form("bottom-center", description="Position: bottom-center, bottom-left, bottom-right, top-center, top-left, top-right"),
    format_style: str = Form("number", description="Format: number, page-of-total, roman"),
    start_number: int = Form(1, description="Starting page number"),
    font_size: int = Form(12, description="Font size (8-24)"),
    skip_first: bool = Form(False, description="Skip first page (for cover)"),
    prefix: str = Form("", description="Prefix before number (e.g., 'Page ')"),
    suffix: str = Form("", description="Suffix after number"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Add page numbers to PDF files
    
    **Features:**
    - Multiple positions
    - Various format styles
    - Custom starting number
    - Skip first page option
    - Custom prefix/suffix
    
    **Formats:**
    - number: 1, 2, 3...
    - page-of-total: 1 of 10, 2 of 10...
    - roman: i, ii, iii, iv...
    """
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Validate parameters
        font_size = max(8, min(24, font_size))
        
        # Read file
        content = await file.read()
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        input_file.write_bytes(content)
        
        output_file = temp_manager.create_temp_file(suffix="_numbered.pdf")
        
        from PyPDF2 import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas
        from reportlab.lib.colors import black
        
        reader = PdfReader(str(input_file))
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        
        def to_roman(num):
            """Convert integer to Roman numeral"""
            val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
            syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i']
            roman_num = ''
            for i in range(len(val)):
                count = int(num / val[i])
                if count:
                    roman_num += syms[i] * count
                    num -= val[i] * count
            return roman_num
        
        def format_page_number(page_num, total):
            """Format page number based on style"""
            if format_style == "roman":
                return f"{prefix}{to_roman(page_num)}{suffix}"
            elif format_style == "page-of-total":
                return f"{prefix}{page_num} of {total}{suffix}"
            else:
                return f"{prefix}{page_num}{suffix}"
        
        def get_position_coords(page_width, page_height, text_width):
            """Get x, y coordinates for position"""
            margin = 40
            positions = {
                "bottom-center": (page_width / 2 - text_width / 2, margin),
                "bottom-left": (margin, margin),
                "bottom-right": (page_width - margin - text_width, margin),
                "top-center": (page_width / 2 - text_width / 2, page_height - margin),
                "top-left": (margin, page_height - margin),
                "top-right": (page_width - margin - text_width, page_height - margin)
            }
            return positions.get(position, positions["bottom-center"])
        
        current_number = start_number
        
        for page_idx, page in enumerate(reader.pages):
            should_number = not (skip_first and page_idx == 0)
            
            if should_number:
                # Get page dimensions
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Format the page number
                pages_for_total = total_pages - (1 if skip_first else 0)
                number_text = format_page_number(current_number, pages_for_total)
                
                # Create page number overlay
                number_buffer = io.BytesIO()
                c = canvas.Canvas(number_buffer, pagesize=(page_width, page_height))
                c.setFont("Helvetica", font_size)
                c.setFillColor(black)
                
                # Calculate text width
                text_width = c.stringWidth(number_text, "Helvetica", font_size)
                x, y = get_position_coords(page_width, page_height, text_width)
                
                c.drawString(x, y, number_text)
                c.save()
                number_buffer.seek(0)
                
                # Merge with page
                from PyPDF2 import PdfReader as NumberReader
                number_pdf = NumberReader(number_buffer)
                page.merge_page(number_pdf.pages[0])
                
                current_number += 1
            
            writer.add_page(page)
        
        # Write output
        with open(output_file, 'wb') as f:
            writer.write(f)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "document"
            output_filename = f"{base_name}_numbered.pdf"
        
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Page numbering failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Add Page Numbers",
        "description": "Add page numbers to PDF files",
        "features": [
            "Multiple positions",
            "Various formats",
            "Custom starting number",
            "Skip first page",
            "Custom prefix/suffix"
        ],
        "options": {
            "position": "bottom-center, bottom-left, bottom-right, top-center, top-left, top-right",
            "format_style": "number, page-of-total, roman",
            "start_number": "Starting number",
            "font_size": "8-24",
            "skip_first": "Skip cover page",
            "prefix": "Text before number",
            "suffix": "Text after number"
        }
    }
