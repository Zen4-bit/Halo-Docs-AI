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
    watermarkText: str = Form("CONFIDENTIAL", description="Watermark text"),
    fontFamily: str = Form("helvetica", description="Font family: helvetica, times, courier"),
    fontSize: int = Form(48, description="Font size (12-200)"),
    color: str = Form("gray", description="Color: gray, red, blue, black"),
    opacity: int = Form(30, description="Opacity (10-100)"),
    rotation: int = Form(0, description="Rotation angle (-180 to 180)"),
    useImageWatermark: bool = Form(False, description="Use image watermark instead of text"),
    imageSize: int = Form(100, description="Image watermark size percentage"),
    tileWatermark: bool = Form(False, description="Tile watermark across page"),
    position: str = Form("center", description="Position: center, top-left, top-center, top-right, bottom-left, bottom-center, bottom-right"),
    pageOption: str = Form("all", description="Pages to watermark: all, odd, even, range"),
    pageRange: str = Form("", description="Page range if pageOption is 'range', e.g. 1-5, 8"),
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
        
        # Validate and normalize parameters
        opacity_float = max(0.1, min(1.0, opacity / 100))
        font_size = max(12, min(200, fontSize))
        
        # Font family mapping
        font_map = {
            "helvetica": "Helvetica-Bold",
            "times": "Times-Bold",
            "courier": "Courier-Bold"
        }
        font_name = font_map.get(fontFamily.lower(), "Helvetica-Bold")
        
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
            if pageOption == "all":
                return True
            elif pageOption == "odd":
                return page_num % 2 == 1
            elif pageOption == "even":
                return page_num % 2 == 0
            elif pageOption == "range" and pageRange:
                # Parse range like "1-5" or "1,3,5"
                try:
                    if "-" in pageRange:
                        start, end = pageRange.split("-")
                        return int(start) <= page_num <= int(end)
                    else:
                        page_list = [int(p.strip()) for p in pageRange.split(",")]
                        return page_num in page_list
                except:
                    return True
            return True
        
        for page_num, page in enumerate(reader.pages, 1):
            if should_watermark(page_num):
                # Get page dimensions
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Create watermark
                watermark_buffer = io.BytesIO()
                c = canvas.Canvas(watermark_buffer, pagesize=(page_width, page_height))
                
                # Set transparency and font
                c.setFillColor(Color(rgb[0], rgb[1], rgb[2], alpha=opacity_float))
                c.setFont(font_name, font_size)
                
                # Calculate text width for positioning
                text_width = c.stringWidth(watermarkText, font_name, font_size)
                
                # Position mapping
                pos_coords = {
                    "center": (page_width / 2, page_height / 2),
                    "top-left": (50 + text_width / 2, page_height - 50),
                    "top-center": (page_width / 2, page_height - 50),
                    "top-right": (page_width - 50 - text_width / 2, page_height - 50),
                    "bottom-left": (50 + text_width / 2, 50),
                    "bottom-center": (page_width / 2, 50),
                    "bottom-right": (page_width - 50 - text_width / 2, 50)
                }
                
                x_pos, y_pos = pos_coords.get(position, (page_width / 2, page_height / 2))
                
                # Handle tiled watermark
                if tileWatermark:
                    # Draw watermark in a grid pattern
                    c.saveState()
                    spacing_x = text_width + 100
                    spacing_y = font_size + 100
                    for y in range(0, int(page_height), int(spacing_y)):
                        for x in range(0, int(page_width), int(spacing_x)):
                            c.saveState()
                            c.translate(x + spacing_x / 2, y + spacing_y / 2)
                            c.rotate(rotation if rotation else 45)
                            c.drawCentredString(0, 0, watermarkText)
                            c.restoreState()
                    c.restoreState()
                else:
                    # Single watermark at position
                    c.saveState()
                    c.translate(x_pos, y_pos)
                    c.rotate(rotation)
                    c.drawCentredString(0, 0, watermarkText)
                    c.restoreState()
                
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
