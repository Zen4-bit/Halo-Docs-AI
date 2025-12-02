"""
Merge PDF Tool Endpoint
Combine multiple PDFs into one with advanced options
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
import json
from pathlib import Path

from utils.file_validator import FileValidator
from utils.temp_manager import temp_manager
from utils.pdf_processor import PDFProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/merge-pdf", tags=["PDF Tools"])

@router.post("")
async def merge_pdf(
    files: List[UploadFile] = File(..., description="PDF files to merge (minimum 2)"),
    # Bookmark options
    addBookmarks: bool = Form(True, description="Add bookmarks for each PDF"),
    bookmarkStyle: str = Form("filename", description="Bookmark naming: filename, numbered, custom"),
    # Page options
    removeBlankPages: bool = Form(False, description="Remove blank pages"),
    removeDuplicates: bool = Form(False, description="Remove duplicate pages"),
    # Metadata
    removeMetadata: bool = Form(False, description="Remove all metadata"),
    setTitle: str = Form("", description="Set document title"),
    setAuthor: str = Form("", description="Set document author"),
    # Optimization
    compressOutput: bool = Form(False, description="Compress merged output"),
    linearize: bool = Form(True, description="Optimize for web viewing"),
    output_filename: Optional[str] = Form(None, description="Output filename")
):
    """
    Merge multiple PDF files into one
    
    **Features:**
    - Merge 2 or more PDFs
    - Preserve or remove metadata
    - Add bookmarks for navigation
    - Maintain original quality
    
    **Usage:**
    - Upload at least 2 PDF files
    - Files will be merged in upload order
    - Configure metadata and bookmark options
    """
    
    # Validate input
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files required")
    
    temp_files = []
    
    try:
        # Validate and save uploaded files
        for idx, file in enumerate(files):
            is_valid, error = await FileValidator.validate_pdf(file)
            FileValidator.raise_if_invalid(is_valid, error)
            
            # Save to temp file
            temp_file = temp_manager.create_temp_file(suffix=f"_input_{idx}.pdf")
            content = await file.read()
            temp_file.write_bytes(content)
            temp_files.append(temp_file)
        
        # Create output file
        output_file = temp_manager.create_temp_file(suffix="_merged.pdf")
        
        # Merge PDFs with all options
        options = {
            'add_bookmarks': addBookmarks,
            'bookmark_style': bookmarkStyle,
            'remove_blank_pages': removeBlankPages,
            'remove_duplicates': removeDuplicates,
            'remove_metadata': removeMetadata,
            'set_title': setTitle,
            'set_author': setAuthor,
            'compress_output': compressOutput,
            'linearize': linearize,
            'preserve_forms': True
        }
        
        PDFProcessor.merge_pdfs(temp_files, output_file, options)
        
        # Determine output filename
        if not output_filename:
            output_filename = "merged.pdf"
        
        # Return file
        return ResponseHelper.file_response(
            output_file,
            filename=output_filename,
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")
    
    finally:
        # Cleanup will happen automatically via temp_manager
        pass

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Merge PDF",
        "description": "Combine multiple PDF files into one",
        "features": [
            "Merge unlimited PDFs",
            "Preserve document quality",
            "Add automatic bookmarks",
            "Remove metadata option",
            "Maintain form fields"
        ],
        "options": {
            "remove_metadata": "bool - Remove all metadata",
            "add_bookmarks": "bool - Add bookmarks for each PDF",
            "output_filename": "string - Custom output filename"
        }
    }
