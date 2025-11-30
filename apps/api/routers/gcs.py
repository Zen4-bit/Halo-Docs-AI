"""
GCS (Google Cloud Storage) router for HALO Docs AI
Provides signed URL generation for secure file uploads
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from routers.auth import get_current_user_optional
from models import User
from services.gcs_service import gcs_service
import uuid

router = APIRouter()


# Pydantic models
class GenerateUploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    file_size: Optional[int] = None


class GenerateUploadUrlResponse(BaseModel):
    signed_url: str
    gcs_path: str
    expires_in_minutes: int


class GenerateDownloadUrlRequest(BaseModel):
    gcs_path: str


class GenerateDownloadUrlResponse(BaseModel):
    signed_url: str
    expires_in_minutes: int


# Endpoints
@router.post("/generate-upload-url", response_model=GenerateUploadUrlResponse)
async def generate_upload_url(
    request: GenerateUploadUrlRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generate a signed URL for uploading a file to GCS
    
    This endpoint is called by the frontend BEFORE uploading a file.
    The frontend will use the returned signed_url to upload directly to GCS.
    """
    # Validate file size (50MB max)
    max_size = int(os.getenv("MAX_FILE_SIZE", 50000000))
    if request.file_size and request.file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {max_size} bytes"
        )
    
    # Validate content type
    allowed_types = os.getenv("ALLOWED_FILE_TYPES", "pdf,doc,docx,txt").split(",")
    file_extension = request.filename.split(".")[-1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File type '.{file_extension}' is not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Generate signed URL
    try:
        expiration_minutes = 15
        user_identifier = str(current_user.id) if current_user else f"guest/{uuid.uuid4()}"
        signed_url, gcs_path = gcs_service.generate_upload_url(
            user_id=user_identifier,
            filename=request.filename,
            content_type=request.content_type,
            expiration_minutes=expiration_minutes
        )
        
        return GenerateUploadUrlResponse(
            signed_url=signed_url,
            gcs_path=gcs_path,
            expires_in_minutes=expiration_minutes
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}"
        )


@router.post("/generate-download-url", response_model=GenerateDownloadUrlResponse)
async def generate_download_url(
    request: GenerateDownloadUrlRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generate a signed URL for downloading a file from GCS
    
    This endpoint is called by the frontend to get a download link
    for a processed file.
    """
    # Verify the file belongs to the current user (check path starts with user_id)
    allowed_prefixes = []
    if current_user:
        allowed_prefixes = [
            f"uploads/{current_user.id}/",
            f"processed/{current_user.id}/"
        ]
    else:
        allowed_prefixes = [
            "uploads/guest/",
            "processed/guest/"
        ]
    
    if not any(request.gcs_path.startswith(prefix) for prefix in allowed_prefixes):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this file"
        )
    
    # Generate signed URL
    try:
        expiration_minutes = 60
        signed_url = gcs_service.generate_download_url(
            gcs_path=request.gcs_path,
            expiration_minutes=expiration_minutes
        )
        
        return GenerateDownloadUrlResponse(
            signed_url=signed_url,
            expires_in_minutes=expiration_minutes
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


import os
