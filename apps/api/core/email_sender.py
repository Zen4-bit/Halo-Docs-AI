"""
Email service using Resend
Handles both welcome emails and task completion notifications
"""
import os
import logging
from typing import Optional
import resend

logger = logging.getLogger(__name__)

# Configure Resend
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "HALO Docs AI <noreply@halodocs.ai>")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY not configured - emails will not be sent")


def send_welcome_email(email: str, name: Optional[str] = None) -> bool:
    """
    Send welcome email to new users
    Called by Clerk webhook after user.created event
    
    Args:
        email: User's email address
        name: User's full name (optional)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if not RESEND_API_KEY:
        logger.warning(f"Skipping welcome email to {email} - Resend not configured")
        return False
    
    display_name = name or "there"
    
    try:
        params = {
            "from": FROM_EMAIL,
            "to": [email],
            "subject": "Welcome to HALO Docs AI! 🚀",
            "html": f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; 
                              padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0; }}
                    .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✨ Welcome to HALO Docs AI</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {display_name}! 👋</h2>
                        <p>Thank you for joining <strong>HALO Docs AI</strong> - your next-generation AI-powered document platform!</p>
                        
                        <p>Here's what you can do with your free account:</p>
                        <ul>
                            <li>📄 Process up to 10 documents per month</li>
                            <li>🤖 Access AI-powered tools (Summarizer, Translator, Content Improver)</li>
                            <li>📎 Use PDF utilities (Merge, Split, Compress)</li>
                            <li>💬 Get AI insights from your documents</li>
                        </ul>
                        
                        <p style="text-align: center;">
                            <a href="https://halodocs.ai/dashboard" class="button">
                                Get Started →
                            </a>
                        </p>
                        
                        <p>Need help? Check out our <a href="https://halodocs.ai/help-center">Help Center</a> 
                        or reply to this email.</p>
                        
                        <p>Happy processing! 🎉</p>
                        <p><strong>The HALO Docs AI Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2024 HALO Docs AI. All rights reserved.</p>
                        <p>
                            <a href="https://halodocs.ai/privacy-policy">Privacy Policy</a> | 
                            <a href="https://halodocs.ai/terms-of-service">Terms of Service</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Welcome email sent to {email}: {response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        return False


def send_task_complete_email(
    email: str,
    task_name: str,
    document_name: str,
    task_id: str,
    name: Optional[str] = None
) -> bool:
    """
    Send task completion notification
    Called by Celery workers after successful task completion
    
    Args:
        email: User's email address
        task_name: Name of the tool (e.g., "AI Summarizer")
        document_name: Original document filename
        task_id: Task UUID for viewing results
        name: User's full name (optional)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if not RESEND_API_KEY:
        logger.warning(f"Skipping task completion email to {email} - Resend not configured")
        return False
    
    display_name = name or "there"
    
    try:
        params = {
            "from": FROM_EMAIL,
            "to": [email],
            "subject": f"✅ Your {task_name} task is complete!",
            "html": f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #10b981; color: white; 
                              padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0; }}
                    .document-info {{ background: white; padding: 15px; border-radius: 5px; 
                                     border-left: 4px solid #10b981; margin: 20px 0; }}
                    .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Task Complete!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {display_name}!</h2>
                        <p>Great news! Your document processing task has finished successfully.</p>
                        
                        <div class="document-info">
                            <p><strong>Tool:</strong> {task_name}</p>
                            <p><strong>Document:</strong> {document_name}</p>
                            <p><strong>Status:</strong> ✅ Completed</p>
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="https://halodocs.ai/dashboard?task={task_id}" class="button">
                                View Results →
                            </a>
                        </p>
                        
                        <p>Your results are ready to view in your dashboard. They'll be available for 30 days.</p>
                        
                        <p>Thanks for using HALO Docs AI! 🚀</p>
                        <p><strong>The HALO Docs AI Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2024 HALO Docs AI. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Task completion email sent to {email}: {response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send task completion email to {email}: {str(e)}")
        return False


def send_task_failed_email(
    email: str,
    task_name: str,
    document_name: str,
    error_message: str,
    name: Optional[str] = None
) -> bool:
    """
    Send task failure notification
    Called by Celery workers if task fails
    """
    if not RESEND_API_KEY:
        return False
    
    display_name = name or "there"
    
    try:
        params = {
            "from": FROM_EMAIL,
            "to": [email],
            "subject": f"❌ Your {task_name} task failed",
            "html": f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; 
                              padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0; }}
                    .error-box {{ background: #fee2e2; padding: 15px; border-radius: 5px; 
                                 border-left: 4px solid #ef4444; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Task Failed</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {display_name},</h2>
                        <p>We encountered an issue while processing your document.</p>
                        
                        <div class="error-box">
                            <p><strong>Tool:</strong> {task_name}</p>
                            <p><strong>Document:</strong> {document_name}</p>
                            <p><strong>Error:</strong> {error_message}</p>
                        </div>
                        
                        <p>Don't worry - you can try again. Here are some tips:</p>
                        <ul>
                            <li>Make sure your file is not corrupted</li>
                            <li>Check that the file format is supported</li>
                            <li>Try with a smaller file if possible</li>
                        </ul>
                        
                        <p style="text-align: center;">
                            <a href="https://halodocs.ai/dashboard" class="button">
                                Try Again →
                            </a>
                        </p>
                        
                        <p>If the problem persists, please <a href="https://halodocs.ai/contact">contact support</a>.</p>
                        
                        <p><strong>The HALO Docs AI Team</strong></p>
                    </div>
                </div>
            </body>
            </html>
            """
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Task failed email sent to {email}: {response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send task failed email to {email}: {str(e)}")
        return False
