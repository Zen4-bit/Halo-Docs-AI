"""
File Validation Utility
Handles file type, size, and format validation for all tools
"""
import os
import magic
from typing import Optional, List, Tuple
from fastapi import UploadFile, HTTPException

class FileValidator:
    """Validates uploaded files for type, size, and format"""
    
    # File size limits (in bytes)
    MAX_PDF_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50MB
    MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
    MAX_OFFICE_SIZE = 100 * 1024 * 1024  # 100MB
    
    # Allowed MIME types
    ALLOWED_TYPES = {
        'pdf': ['application/pdf'],
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'],
        'video': ['video/mp4', 'video/mpeg', 'video/webm', 'video/x-msvideo', 'video/quicktime'],
        'word': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'excel': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'powerpoint': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    }
    
    @staticmethod
    async def validate_file(
        file: UploadFile,
        allowed_types: List[str],
        max_size: int,
        check_magic: bool = True
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate a single file
        Returns: (is_valid, error_message)
        """
        try:
            # Check if file exists
            if not file or not file.filename:
                return False, "No file provided"
            
            # Read file content
            content = await file.read()
            await file.seek(0)  # Reset file pointer
            
            # Check file size
            file_size = len(content)
            if file_size > max_size:
                max_mb = max_size / (1024 * 1024)
                return False, f"File size exceeds {max_mb}MB limit"
            
            if file_size == 0:
                return False, "File is empty"
            
            # Check MIME type using python-magic
            if check_magic:
                mime = magic.from_buffer(content, mime=True)
                
                # Build allowed MIME list
                allowed_mimes = []
                for type_key in allowed_types:
                    if type_key in FileValidator.ALLOWED_TYPES:
                        allowed_mimes.extend(FileValidator.ALLOWED_TYPES[type_key])
                
                if mime not in allowed_mimes:
                    return False, f"Invalid file type. Expected: {', '.join(allowed_types)}, Got: {mime}"
            
            # Check file extension
            ext = os.path.splitext(file.filename)[1].lower()
            if not ext:
                return False, "File has no extension"
            
            return True, None
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    @staticmethod
    async def validate_pdf(file: UploadFile) -> Tuple[bool, Optional[str]]:
        """Validate PDF file"""
        return await FileValidator.validate_file(
            file, ['pdf'], FileValidator.MAX_PDF_SIZE
        )
    
    @staticmethod
    async def validate_image(file: UploadFile) -> Tuple[bool, Optional[str]]:
        """Validate image file"""
        return await FileValidator.validate_file(
            file, ['image'], FileValidator.MAX_IMAGE_SIZE
        )
    
    @staticmethod
    async def validate_video(file: UploadFile) -> Tuple[bool, Optional[str]]:
        """Validate video file"""
        return await FileValidator.validate_file(
            file, ['video'], FileValidator.MAX_VIDEO_SIZE
        )
    
    @staticmethod
    async def validate_office(file: UploadFile, doc_type: str) -> Tuple[bool, Optional[str]]:
        """Validate office document"""
        return await FileValidator.validate_file(
            file, [doc_type], FileValidator.MAX_OFFICE_SIZE
        )
    
    @staticmethod
    def raise_if_invalid(is_valid: bool, error_msg: Optional[str]):
        """Raise HTTPException if validation failed"""
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg or "Invalid file")
