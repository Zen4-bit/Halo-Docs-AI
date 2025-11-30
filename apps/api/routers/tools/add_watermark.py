"""
Add Watermark Tool Endpoint
Add text or image watermarks to PDF files
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from pathlib import Path
import io

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/add-watermark", tags=["PDF Tools"])

@router.post("")
async def add_watermark(
    file: UploadFile = File(..., description="PDF file to watermark"),
    watermark_text: str = Form("CONFIDENTIAL", description="Watermark text"),
    position: str = Form("center", description="Position: center, diagonal, header, footer"),
    opacity: float = Form(0.3, description="Opacity (0.1-1.0)"),
    font_size: int = Form(48, description="Font size (12-200)"),
    color: str = Form("gray", description="Color: gray, red, blue, black"),
    pages: str = Form("all", description="Pages to watermark: all, odd, even, or range like 1-5"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Add watermarks to PDF files
    
    **Features:**
    - Text watermarks
    - Multiple positions (center, diagonal, header, footer)
    - Adjustable opacity and size
    - Apply to specific pages
    
    **Positions:**
    - center: Center of page
    - diagonal: Diagonal across page
    - header: Top of page
    - footer: Bottom of page
    """
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        FileValidator.raise_if_invalid(is_valid, error)
        
        # Validate parameters
        opacity = max(0.1, min(1.0, opacity))
        font_size = max(12, min(200, font_size))
        
        # Read file
        content = await file.read()
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        input_file.write_bytes(content)
        
        output_file = temp_manager.create_temp_file(suffix="_watermarked.pdf")
        
        # Add watermark using reportlab and PyPDF2
        from PyPDF2 import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.colors import Color
        
        # Color mapping
        color_map = {
            "gray": (0.5, 0.5, 0.5),
            "red": (0.8, 0.2, 0.2),
            "blue": (0.2, 0.2, 0.8),
            "black": (0, 0, 0)
        }
        rgb = color_map.get(color.lower(), (0.5, 0.5, 0.5))
        
        reader = PdfReader(str(input_file))
        writer = PdfWriter()
        
        total_pages = len(reader.pages)
        
        # Determine which pages to watermark
        def should_watermark(page_num):
            if pages == "all":
                return True
            elif pages == "odd":
                return page_num % 2 == 1
            elif pages == "even":
                return page_num % 2 == 0
            else:
                # Parse range like "1-5" or "1,3,5"
                try:
                    if "-" in pages:
                        start, end = pages.split("-")
                        return int(start) <= page_num <= int(end)
                    else:
                        page_list = [int(p.strip()) for p in pages.split(",")]
                        return page_num in page_list
                except:
                    return True
        
        for page_num, page in enumerate(reader.pages, 1):
            if should_watermark(page_num):
                # Get page dimensions
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Create watermark
                watermark_buffer = io.BytesIO()
                c = canvas.Canvas(watermark_buffer, pagesize=(page_width, page_height))
                
                # Set transparency
                c.setFillColor(Color(rgb[0], rgb[1], rgb[2], alpha=opacity))
                c.setFont("Helvetica-Bold", font_size)
                
                # Calculate text width for positioning
                text_width = c.stringWidth(watermark_text, "Helvetica-Bold", font_size)
                
                if position == "center":
                    c.saveState()
                    c.translate(page_width / 2, page_height / 2)
                    c.drawCentredString(0, 0, watermark_text)
                    c.restoreState()
                    
                elif position == "diagonal":
                    c.saveState()
                    c.translate(page_width / 2, page_height / 2)
                    c.rotate(45)
                    c.drawCentredString(0, 0, watermark_text)
                    c.restoreState()
                    
                elif position == "header":
                    c.drawCentredString(page_width / 2, page_height - 50, watermark_text)
                    
                elif position == "footer":
                    c.drawCentredString(page_width / 2, 30, watermark_text)
                
                c.save()
                watermark_buffer.seek(0)
                
                # Merge watermark with page
                from PyPDF2 import PdfReader as WatermarkReader
                watermark_pdf = WatermarkReader(watermark_buffer)
                page.merge_page(watermark_pdf.pages[0])
            
            writer.add_page(page)
        
        # Write output
        with open(output_file, 'wb') as f:
            writer.write(f)
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "document"
            output_filename = f"{base_name}_watermarked.pdf"
        
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermark failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Add Watermark",
        "description": "Add text watermarks to PDF files",
        "features": [
            "Text watermarks",
            "Multiple positions",
            "Adjustable opacity",
            "Custom colors",
            "Page selection"
        ],
        "options": {
            "watermark_text": "Text to display",
            "position": "center, diagonal, header, footer",
            "opacity": "0.1-1.0",
            "font_size": "12-200",
            "color": "gray, red, blue, black",
            "pages": "all, odd, even, or range"
        }
    }
