"""
Webhook handlers for external services (Clerk)
"""
import os
import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from svix.webhooks import Webhook, WebhookVerificationError

import models
from database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")


@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Clerk webhook receiver for user sync
    Handles user.created events to sync Clerk users to local PostgreSQL
    
    This is the critical bridge between Clerk (auth) and FastAPI (data)
    """
    if not CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    # Get webhook headers
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")
    
    if not all([svix_id, svix_timestamp, svix_signature]):
        raise HTTPException(status_code=400, detail="Missing svix headers")
    
    # Get raw body
    body = await request.body()
    
    # Verify webhook signature using svix
    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        payload = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        })
    except WebhookVerificationError as e:
        logger.error(f"Webhook verification failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")
    
    # Parse event
    event_type = payload.get("type")
    data = payload.get("data", {})
    
    logger.info(f"Received Clerk webhook: {event_type}")
    
    # Handle user.created event
    if event_type == "user.created":
        clerk_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        
        # Get primary email
        primary_email = None
        for email_obj in email_addresses:
            if email_obj.get("id") == data.get("primary_email_address_id"):
                primary_email = email_obj.get("email_address")
                break
        
        if not primary_email and email_addresses:
            # Fallback to first email
            primary_email = email_addresses[0].get("email_address")
        
        if not clerk_id or not primary_email:
            logger.error(f"Missing clerk_id or email in webhook payload")
            raise HTTPException(status_code=400, detail="Invalid user data")
        
        # Extract name
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or None
        
        # Check if user already exists
        existing_user = db.query(models.User).filter(
            models.User.clerk_id == clerk_id
        ).first()
        
        if existing_user:
            logger.info(f"User {clerk_id} already exists, skipping")
            return {"status": "user_exists"}
        
        # Create new user in local database
        new_user = models.User(
            clerk_id=clerk_id,
            email=primary_email,
            full_name=full_name,
            subscription_tier=models.SubscriptionTier.FREE
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Created new user: {new_user.id} (Clerk: {clerk_id})")
        
        # Send welcome email
        try:
            from core.email_sender import send_welcome_email
            send_welcome_email(primary_email, full_name)
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
        
        return {
            "status": "user_created",
            "user_id": str(new_user.id)
        }
    
    # Handle user.updated event (optional)
    elif event_type == "user.updated":
        clerk_id = data.get("id")
        
        user = db.query(models.User).filter(
            models.User.clerk_id == clerk_id
        ).first()
        
        if user:
            # Update user data
            email_addresses = data.get("email_addresses", [])
            if email_addresses:
                for email_obj in email_addresses:
                    if email_obj.get("id") == data.get("primary_email_address_id"):
                        user.email = email_obj.get("email_address")
                        break
            
            first_name = data.get("first_name", "")
            last_name = data.get("last_name", "")
            full_name = f"{first_name} {last_name}".strip()
            if full_name:
                user.full_name = full_name
            
            db.commit()
            logger.info(f"Updated user: {user.id}")
        
        return {"status": "user_updated"}
    
    # Handle user.deleted event (optional)
    elif event_type == "user.deleted":
        clerk_id = data.get("id")
        
        user = db.query(models.User).filter(
            models.User.clerk_id == clerk_id
        ).first()
        
        if user:
            # Soft delete or hard delete based on requirements
            # For now, we'll keep the user but could add a deleted_at field
            logger.info(f"User deleted in Clerk: {clerk_id}")
        
        return {"status": "user_deleted"}
    
    # Unknown event type
    return {"status": "ignored", "event_type": event_type}
