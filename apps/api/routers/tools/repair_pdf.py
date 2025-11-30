"""
Repair PDF Tool Endpoint
Fix corrupted or damaged PDF files
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/repair-pdf", tags=["PDF Tools"])

@router.post("")
async def repair_pdf(
    file: UploadFile = File(..., description="PDF file to repair"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Repair corrupted or damaged PDF files
    
    **Features:**
    - Fix corrupted PDF structure
    - Recover readable content
    - Rebuild document tree
    - Fix broken cross-references
    
    **Note:** Severely damaged files may not be fully recoverable
    """
    try:
        # Validate PDF
        is_valid, error = await FileValidator.validate_pdf(file)
        
        # For repair, we try even if validation fails
        content = await file.read()
        
        # Save uploaded file
        input_file = temp_manager.create_temp_file(suffix="_input.pdf")
        input_file.write_bytes(content)
        original_size = len(content)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_repaired.pdf")
        
        # Try to repair using pikepdf (robust PDF library)
        try:
            import pikepdf
            
            # Open with recovery mode
            with pikepdf.open(input_file, allow_overwriting_input=True) as pdf:
                # Remove invalid objects and rebuild
                pdf.remove_unreferenced_resources()
                
                # Save repaired PDF
                pdf.save(
                    output_file,
                    linearize=True,  # Optimize for web
                    compress_streams=True
                )
            
            repair_status = "success"
            
        except pikepdf.PdfError as e:
            # Try more aggressive repair with PyPDF2
            try:
                from PyPDF2 import PdfReader, PdfWriter
                
                reader = PdfReader(str(input_file), strict=False)
                writer = PdfWriter()
                
                # Copy all readable pages
                pages_recovered = 0
                for page in reader.pages:
                    try:
                        writer.add_page(page)
                        pages_recovered += 1
                    except:
                        continue
                
                if pages_recovered == 0:
                    raise HTTPException(
                        status_code=422, 
                        detail="Could not recover any pages from the PDF"
                    )
                
                with open(output_file, 'wb') as f:
                    writer.write(f)
                
                repair_status = f"partial - recovered {pages_recovered} pages"
                
            except Exception as inner_e:
                raise HTTPException(
                    status_code=422, 
                    detail=f"PDF is too damaged to repair: {str(inner_e)}"
                )
        
        # Output filename
        if not output_filename:
            base_name = file.filename.rsplit('.', 1)[0] if file.filename else "document"
            output_filename = f"{base_name}_repaired.pdf"
        
        repaired_size = output_file.stat().st_size
        
        # Return repaired file
        response = ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        response.headers["X-Repair-Status"] = repair_status
        response.headers["X-Original-Size"] = str(original_size)
        response.headers["X-Repaired-Size"] = str(repaired_size)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repair failed: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Repair PDF",
        "description": "Fix corrupted or damaged PDF files",
        "features": [
            "Fix corrupted structure",
            "Recover readable content",
            "Rebuild document tree",
            "Fix cross-references",
            "Optimize output"
        ],
        "limitations": [
            "Severely damaged files may not be fully recoverable",
            "Encrypted PDFs must be decrypted first",
            "Some formatting may be lost"
        ]
    }
