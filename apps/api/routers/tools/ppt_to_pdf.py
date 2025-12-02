"""
PPT to PDF Tool Endpoint
Convert PowerPoint presentations to PDF
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.office_processor import OfficeProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/ppt-to-pdf", tags=["Office Tools"])

@router.post("")
async def ppt_to_pdf(
    file: UploadFile = File(..., description="PowerPoint file to convert (.ppt or .pptx)"),
    # Quality Settings
    quality: str = Form("high", description="Output quality: low, medium, high"),
    # Layout Options
    slidesPerPage: int = Form(1, description="Slides per page: 1, 2, 4, 6, 9"),
    orientation: str = Form("landscape", description="Orientation: portrait, landscape"),
    # Content Options
    includeNotes: bool = Form(False, description="Include speaker notes"),
    includeHiddenSlides: bool = Form(False, description="Include hidden slides"),
    includeComments: bool = Form(False, description="Include comments"),
    # Slide Selection
    allSlides: bool = Form(True, description="Convert all slides"),
    slideRange: str = Form("", description="Slide range if not all, e.g. 1-5, 8, 10-12"),
    # Export Options
    preserveAnimations: bool = Form(False, description="Preserve animations as multiple pages"),
    preserveTransitions: bool = Form(False, description="Include transition markers"),
    embedFonts: bool = Form(True, description="Embed fonts"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Convert PowerPoint presentation to PDF
    
    **Supported Formats:**
    - PPTX (PowerPoint 2007+)
    - PPT (PowerPoint 97-2003)
    
    **Features:**
    - High-quality conversion
    - Multiple quality levels
    - Include speaker notes
    - Multiple slides per page
    - Preserve animations as static
    - Professional output
    
    **Quality Levels:**
    - **low**: Fastest, smaller file
    - **medium**: Balanced
    - **high**: Best quality (recommended)
    
    **Uses LibreOffice** for conversion
    """
    
    try:
        # Validate PowerPoint file
        is_valid, error = await FileValidator.validate_office(file, 'powerpoint')
        FileValidator.raise_if_invalid(is_valid, error)
        
        if quality not in ['low', 'medium', 'high']:
            raise HTTPException(status_code=400, detail="Quality must be 'low', 'medium', or 'high'")
        
        if slidesPerPage not in [1, 2, 4, 6, 9]:
            raise HTTPException(status_code=400, detail="Slides per page must be 1, 2, 4, 6, or 9")
        
        # Save uploaded file
        ext = file.filename.split('.')[-1].lower()
        input_file = temp_manager.create_temp_file(suffix=f"_input.{ext}")
        content = await file.read()
        input_file.write_bytes(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_output.pdf")
        
        # Convert to PDF with all options
        options = {
            'quality': quality,
            'slides_per_page': slidesPerPage,
            'orientation': orientation,
            'include_notes': includeNotes,
            'include_hidden_slides': includeHiddenSlides,
            'include_comments': includeComments,
            'all_slides': allSlides,
            'slide_range': slideRange,
            'preserve_animations': preserveAnimations,
            'preserve_transitions': preserveTransitions,
            'embed_fonts': embedFonts
        }
        
        OfficeProcessor.ppt_to_pdf(input_file, output_file, options)
        
        # Determine output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "presentation"
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
        "name": "PPT to PDF",
        "description": "Convert PowerPoint presentations to PDF",
        "features": [
            "Supports PPT and PPTX",
            "Multiple quality levels",
            "Include speaker notes",
            "Multiple slides per page",
            "Preserve layout",
            "Professional output"
        ],
        "supported_formats": ["ppt", "pptx"],
        "requirements": ["LibreOffice installation required"],
        "quality_levels": {
            "low": "Fastest, smaller file",
            "medium": "Balanced quality and size",
            "high": "Best quality (recommended)"
        },
        "options": {
            "quality": "string - Output quality (low/medium/high)",
            "include_notes": "bool - Include speaker notes",
            "slides_per_page": "int - Slides per page (1/2/4/6/9)",
            "output_filename": "string - Output filename"
        }
    }
