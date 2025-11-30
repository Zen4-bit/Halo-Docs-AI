"""
User management router for HALO Docs AI
Implements profile management and document history
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import User, Document, SubscriptionTier
from routers.auth import get_current_user

router = APIRouter()


# Pydantic models
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    subscription_tier: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    mime_type: str
    upload_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserDocumentsResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


# User profile endpoints
@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile information
    """
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        subscription_tier=current_user.subscription_tier.value,
        created_at=current_user.created_at
    )


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile information
    """
    # Update full name if provided
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    
    # Update email if provided and not already taken
    if profile_update.email is not None and profile_update.email != current_user.email:
        existing_user = db.query(User).filter(User.email == profile_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = profile_update.email
    
    db.commit()
    db.refresh(current_user)
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        subscription_tier=current_user.subscription_tier.value,
        created_at=current_user.created_at
    )


@router.get("/documents", response_model=UserDocumentsResponse)
async def get_user_documents(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all documents uploaded by the current user
    """
    # Query documents with pagination
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(
        Document.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Get total count
    total = db.query(Document).filter(
        Document.user_id == current_user.id
    ).count()
    
    return UserDocumentsResponse(
        documents=[
            DocumentResponse(
                id=str(doc.id),
                filename=doc.filename,
                file_size=doc.file_size,
                mime_type=doc.mime_type,
                upload_status=doc.upload_status.value,
                created_at=doc.created_at
            )
            for doc in documents
        ],
        total=total
    )


@router.delete("/documents/{document_id}")
async def delete_user_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific document
    """
    # Find document
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    # TODO: Delete from GCS storage
    
    return {"message": "Document deleted successfully"}
