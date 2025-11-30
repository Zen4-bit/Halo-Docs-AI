"""
Simple authentication module for HALO Docs AI
Provides optional authentication for API endpoints
"""
from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
import models
from database import get_db


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Optional authentication - returns None if no auth provided
    This allows endpoints to work without authentication for development
    """
    # For development/testing, return a mock user if no auth provided
    # In production, you would validate JWT tokens here
    
    if not authorization:
        # Return a mock user for unauthenticated requests
        mock_user = models.User(
            id=1,
            email="anonymous@halodocs.ai",
            full_name="Anonymous User"
        )
        return mock_user
    
    # If authorization header is provided, validate it
    # For now, just return mock user
    # TODO: Implement proper JWT validation in production
    
    return models.User(
        id=1,
        email="user@halodocs.ai",
        full_name="Test User"
    )


async def get_current_user_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[models.User]:
    """
    Optional authentication - returns None if no auth provided
    Used for endpoints that work with or without authentication
    """
    if not authorization:
        return None
    
    # For now, return a mock user
    # TODO: Implement proper JWT validation in production
    return models.User(
        id=1,
        email="user@halodocs.ai",
        full_name="Test User"
    )
