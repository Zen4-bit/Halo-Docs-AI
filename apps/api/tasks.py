"""
Celery tasks for async document processing
All AI and heavy computation tools run as background tasks
"""
import os
import io
import logging
from datetime import datetime
from typing import Optional
import boto3
from botocore.exceptions import ClientError
import pdfplumber

from celery_app import celery_app
from database import SessionLocal
import models
from core.email_sender import send_task_complete_email, send_task_failed_email
from services.vertex_ai_tools import vertex_ai_tools

logger = logging.getLogger(__name__)

# AWS S3 Configuration
AWS_BUCKET = os.getenv("AWS_BUCKET", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Vertex AI is now configured in vertex_ai_tools service
logger.info("Vertex AI tools service initialized")


def download_from_s3(s3_key: str) -> bytes:
    """Helper function to download file from S3"""
    try:
        response = s3_client.get_object(Bucket=AWS_BUCKET, Key=s3_key)
        return response['Body'].read()
    except ClientError as e:
        logger.error(f"Failed to download {s3_key} from S3: {str(e)}")
        raise


def update_task_status(
    task_id: str,
    status: models.TaskStatus,
    result_data: Optional[dict] = None,
    error_message: Optional[str] = None
):
    """Helper function to update task status in database"""
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if task:
            task.status = status
            if result_data:
                task.result_data = result_data
            if error_message:
                task.error_message = error_message
            if status == models.TaskStatus.COMPLETED or status == models.TaskStatus.FAILED:
                task.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


@celery_app.task(name="run_ai_summarization", bind=True)
def run_ai_summarization(self, task_id: str):
    """
    AI Summarizer - Extract key points from documents
    Uses Halo-AI native PDF processing
    """
    db = SessionLocal()
    try:
        # Get task from database
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            logger.error(f"Task {task_id} not found")
            return
        
        # Update status to processing
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        # Get document and user
        document = task.original_document
        user = task.user
        
        # Download PDF from S3
        logger.info(f"Downloading document {document.id} from S3")
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF")
        import pdfplumber
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        # Prepare prompt for Vertex AI
        prompt = f"""Provide a comprehensive, professional executive summary of this document. 
        Focus on:
        - Main topics and themes
        - Key findings and conclusions
        - Important data points or statistics
        - Actionable insights
        
        Format the summary in clear, concise paragraphs.

Document content:
{text_content[:15000]}"""
        
        # Call Vertex AI API
        logger.info("Calling Vertex AI API for summarization")
        import asyncio
        summary = asyncio.run(vertex_ai_tools.summarize_text(text_content, length="long", format_type="paragraphs"))
        
        # Update task with results
        task.result_data = {
            "summary": summary,
            "word_count": len(summary.split()),
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Summarization completed for task {task_id}")
        
        # Send completion email
        try:
            send_task_complete_email(
                email=user.email,
                task_name="AI Summarizer",
                document_name=document.filename,
                task_id=str(task.id),
                name=user.full_name
            )
        except Exception as e:
            logger.error(f"Failed to send completion email: {str(e)}")
        
    except Exception as e:
        logger.error(f"Summarization failed for task {task_id}: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
        
        # Send failure email
        try:
            send_task_failed_email(
                email=user.email,
                task_name="AI Summarizer",
                document_name=document.filename,
                error_message=str(e),
                name=user.full_name
            )
        except:
            pass
    
    finally:
        db.close()


@celery_app.task(name="run_ai_translation", bind=True)
def run_ai_translation(self, task_id: str, target_language: str = "Spanish"):
    """
    AI Translator - Translate documents to target language
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        # Download PDF
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for translation")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        logger.info(f"Translating to {target_language}")
        import asyncio
        translated_text = asyncio.run(vertex_ai_tools.translate_text(text_content, target_language, preserve_formatting=True))
        
        task.result_data = {
            "translated_text": translated_text,
            "target_language": target_language,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Translation completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="AI Translator",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_content_improvement", bind=True)
def run_content_improvement(self, task_id: str, style: str = "professional"):
    """
    Content Improver - Enhance document quality and clarity
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for content improvement")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        logger.info(f"Improving content with {style} style")
        import asyncio
        improved_text = asyncio.run(vertex_ai_tools.improve_content(text_content, style))
        
        task.result_data = {
            "improved_text": improved_text,
            "style": style,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Content improvement completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="Content Improver",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Content improvement failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_ai_review", bind=True)
def run_ai_review(self, task_id: str, review_type: str = "general"):
    """
    AI Reviewer - Provide detailed feedback on documents
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for review")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        logger.info(f"Reviewing document with {review_type} focus")
        import asyncio
        review = asyncio.run(vertex_ai_tools.review_content(text_content, review_type))
        
        task.result_data = {
            "review": review,
            "review_type": review_type,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Review completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="AI Reviewer",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Review failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_text_extraction", bind=True)
def run_text_extraction(self, task_id: str):
    """
    Text Extraction for AI Insights (Phase 1 of RAG)
    Uses pdfplumber for high-fidelity text extraction
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Use pdfplumber for precise text extraction
        logger.info(f"Extracting text with pdfplumber")
        full_text = ""
        
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    full_text += f"\n\n--- Page {page_num} ---\n\n{text}"
        
        if not full_text.strip():
            raise Exception("No text could be extracted from the PDF")
        
        task.result_data = {
            "full_text": full_text,
            "page_count": len(full_text.split("--- Page")),
            "character_count": len(full_text),
            "document_name": document.filename,
            "indexed": True
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Text extraction completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="AI Insights (Indexing)",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Text extraction failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_ai_redaction", bind=True)
def run_ai_redaction(self, task_id: str, redact_types: list = None):
    """
    AI Redactor - Identify and remove sensitive information
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for redaction")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        redact_types = redact_types or ["email", "phone", "ssn", "credit_card", "names", "addresses"]
        
        logger.info(f"Redacting sensitive information")
        import asyncio
        redacted_text = asyncio.run(vertex_ai_tools.redact_content(text_content, redact_types))
        
        task.result_data = {
            "redacted_text": redacted_text,
            "redact_types": redact_types,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Redaction completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="AI Redactor",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Redaction failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_resume_optimization", bind=True)
def run_resume_optimization(self, task_id: str):
    """
    Resume Optimizer - Enhance resume for ATS systems
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        # Get parameters from task result_data
        target_role = task.result_data.get("target_role") if task.result_data else None
        keywords = task.result_data.get("keywords", []) if task.result_data else []
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for resume optimization")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        logger.info("Optimizing resume with Vertex AI")
        import asyncio
        optimized_resume = asyncio.run(vertex_ai_tools.optimize_resume(text_content, target_role, keywords))
        
        task.result_data = {
            "optimized_resume": optimized_resume,
            "target_role": target_role,
            "keywords": keywords,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Resume optimization completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="Resume Optimizer",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Resume optimization failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_proposal_generation", bind=True)
def run_proposal_generation(self, task_id: str):
    """
    Proposal Writer - Generate professional business proposals
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        # Get parameters from task result_data
        proposal_type = task.result_data.get("proposal_type", "business") if task.result_data else "business"
        tone = task.result_data.get("tone", "professional") if task.result_data else "professional"
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for proposal generation")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        logger.info(f"Generating {proposal_type} proposal")
        import asyncio
        proposal = asyncio.run(vertex_ai_tools.generate_proposal(text_content, proposal_type, tone))
        
        task.result_data = {
            "proposal": proposal,
            "proposal_type": proposal_type,
            "tone": tone,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Proposal generation completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="Proposal Writer",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Proposal generation failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()


@celery_app.task(name="run_tagline_generation", bind=True)
def run_tagline_generation(self, task_id: str):
    """
    Tagline Maker - Generate catchy taglines and slogans
    """
    db = SessionLocal()
    try:
        task = db.query(models.ProcessingTask).filter(
            models.ProcessingTask.id == task_id
        ).first()
        
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        db.commit()
        
        document = task.original_document
        user = task.user
        
        # Get parameters from task result_data
        count = task.result_data.get("count", 5) if task.result_data else 5
        style = task.result_data.get("style", "catchy") if task.result_data else "catchy"
        
        doc_bytes = download_from_s3(document.s3_key)
        
        # Extract text from PDF
        logger.info("Extracting text from PDF for tagline generation")
        text_content = ""
        with pdfplumber.open(io.BytesIO(doc_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
        
        logger.info(f"Generating {count} taglines with {style} style")
        import asyncio
        taglines = asyncio.run(vertex_ai_tools.generate_taglines(text_content, count, style))
        
        task.result_data = {
            "taglines": taglines[:count],
            "count": len(taglines[:count]),
            "style": style,
            "document_name": document.filename,
            "full_text": text_content  # Store for insights chat
        }
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Tagline generation completed for task {task_id}")
        
        send_task_complete_email(
            email=user.email,
            task_name="Tagline Maker",
            document_name=document.filename,
            task_id=str(task.id),
            name=user.full_name
        )
        
    except Exception as e:
        logger.error(f"Tagline generation failed: {str(e)}")
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    
    finally:
        db.close()
