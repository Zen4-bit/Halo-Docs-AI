"""
File upload handlers using Cloud Storage (Local/GCS/S3)
Implements secure, scalable file ingestion pipeline
"""
import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
from routers.auth import get_current_user
from storage import storage, LocalStorage

logger = logging.getLogger(__name__)

router = APIRouter()

# AWS S3 Configuration
AWS_BUCKET = os.getenv("AWS_BUCKET", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# Initialize S3 client
# s3_client = boto3.client(
#     's3',
#     region_name=AWS_REGION,
#     aws_access_key_id=AWS_ACCESS_KEY_ID,
#     aws_secret_access_key=AWS_SECRET_ACCESS_KEY
# )


class GenerateUploadUrlRequest(BaseModel):
    filename: str
    file_type: str
    file_size: int  # in bytes


class GenerateUploadUrlResponse(BaseModel):
    upload_url: str
    fields: dict
    s3_key: str
    document_id: str


class CompleteUploadRequest(BaseModel):
    document_id: str
    s3_key: str
    filename: str
    file_size: int
    mime_type: str


@router.post("/generate-url", response_model=GenerateUploadUrlResponse)
async def generate_upload_url(
    request: GenerateUploadUrlRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1: Generate presigned S3 upload URL
    
    Flow:
    1. Client requests presigned URL
    2. Server generates short-lived URL (5-10 min)
    3. Client uploads directly to S3 (bypassing server)
    4. Client calls /complete endpoint
    """
    if not AWS_BUCKET:
        raise HTTPException(status_code=500, detail="S3 not configured")
    
    # Validate file type
    allowed_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
    
    if request.file_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type {request.file_type} not supported"
        )
    
    # Check file size limits based on subscription tier
    max_size_mb = {
        models.SubscriptionTier.FREE: 50,
        models.SubscriptionTier.PRO: 500,
        models.SubscriptionTier.TEAM: 1000
    }
    
    max_bytes = max_size_mb[user.subscription_tier] * 1024 * 1024
    if request.file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {max_size_mb[user.subscription_tier]}MB limit for {user.subscription_tier} tier"
        )
    
    # Generate unique S3 key
    # Format: user_id/document_id/filename
    document_id = str(uuid.uuid4())
    file_extension = request.filename.split('.')[-1] if '.' in request.filename else 'pdf'
    s3_key = f"{user.id}/{document_id}.{file_extension}"
    
    # Create document record in database (status=pending)
    document = models.Document(
        id=uuid.UUID(document_id),
        user_id=user.id,
        filename=request.filename,
        s3_key=s3_key,
        file_size=request.file_size,
        mime_type=request.file_type,
        upload_status=models.UploadStatus.PENDING
    )
    
    db.add(document)
    db.commit()
    
    # Generate presigned POST URL
    try:
        presigned_post = s3_client.generate_presigned_post(
            Bucket=AWS_BUCKET,
            Key=s3_key,
            Fields={
                "Content-Type": request.file_type,
                "x-amz-meta-user-id": str(user.id),
                "x-amz-meta-document-id": document_id
            },
            Conditions=[
                {"Content-Type": request.file_type},
                ["content-length-range", 0, request.file_size + 1024]  # Allow small buffer
            ],
            ExpiresIn=600  # 10 minutes
        )
        
        logger.info(f"Generated presigned URL for user {user.id}, document {document_id}")
        
        return GenerateUploadUrlResponse(
            upload_url=presigned_post['url'],
            fields=presigned_post['fields'],
            s3_key=s3_key,
            document_id=document_id
        )
        
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {str(e)}")
        db.delete(document)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")


@router.post("/complete")
async def complete_upload(
    request: CompleteUploadRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 2: Finalize upload after client completes S3 upload
    
    Updates document status to 'completed'
    Verifies file exists in S3
    """
    # Get document from database
    document = db.query(models.Document).filter(
        models.Document.id == uuid.UUID(request.document_id),
        models.Document.user_id == user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document.upload_status == models.UploadStatus.COMPLETED:
        return {
            "status": "already_completed",
            "document_id": str(document.id)
        }
    
    # Verify file exists in S3
    try:
        s3_client.head_object(Bucket=AWS_BUCKET, Key=request.s3_key)
    except ClientError as e:
        logger.error(f"S3 verification failed for {request.s3_key}: {str(e)}")
        document.upload_status = models.UploadStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail="File not found in S3")
    
    # Update document status
    document.upload_status = models.UploadStatus.COMPLETED
    db.commit()
    
    logger.info(f"Upload completed: document {document.id}")
    
    return {
        "status": "completed",
        "document_id": str(document.id),
        "s3_key": document.s3_key
    }


@router.get("/documents")
async def list_user_documents(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    List all documents for the current user
    """
    documents = db.query(models.Document).filter(
        models.Document.user_id == user.id,
        models.Document.upload_status == models.UploadStatus.COMPLETED
    ).order_by(
        models.Document.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    return {
        "documents": [
            {
                "id": str(doc.id),
                "filename": doc.filename,
                "file_size": doc.file_size,
                "mime_type": doc.mime_type,
                "created_at": doc.created_at.isoformat()
            }
            for doc in documents
        ],
        "total": len(documents)
    }
