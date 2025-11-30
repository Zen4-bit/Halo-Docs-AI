"""
Document Processor Service
Handles text extraction from various document formats
"""
import logging
from typing import Optional
from fastapi import UploadFile
import PyPDF2
import pdfplumber
from io import BytesIO

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Service for processing and extracting text from documents"""
    
    async def extract_text(self, file: UploadFile) -> str:
        """
        Extract text from uploaded document
        
        Args:
            file: Uploaded file
        
        Returns:
            Extracted text content
        """
        try:
            content = await file.read()
            filename = file.filename.lower()
            
            if filename.endswith('.pdf'):
                return await self._extract_from_pdf(content)
            elif filename.endswith(('.txt', '.md')):
                return content.decode('utf-8')
            elif filename.endswith(('.doc', '.docx')):
                return await self._extract_from_docx(content)
            else:
                raise ValueError(f"Unsupported file type: {filename}")
        
        except Exception as e:
            logger.error(f"Text extraction error: {str(e)}")
            raise
    
    async def _extract_from_pdf(self, content: bytes) -> str:
        """
        Extract text from PDF using multiple methods
        
        Args:
            content: PDF file content
        
        Returns:
            Extracted text
        """
        text = ""
        
        try:
            # Try pdfplumber first (better for complex layouts)
            with pdfplumber.open(BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            
            if text.strip():
                return text.strip()
        
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {str(e)}")
        
        try:
            # Fallback to PyPDF2
            pdf_reader = PyPDF2.PdfReader(BytesIO(content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
            
            return text.strip()
        
        except Exception as e:
            logger.error(f"PyPDF2 extraction failed: {str(e)}")
            raise ValueError("Failed to extract text from PDF")
    
    async def _extract_from_docx(self, content: bytes) -> str:
        """
        Extract text from DOCX file
        
        Args:
            content: DOCX file content
        
        Returns:
            Extracted text
        """
        try:
            # Try using python-docx if available
            try:
                import docx
                doc = docx.Document(BytesIO(content))
                text = "\n\n".join([paragraph.text for paragraph in doc.paragraphs])
                return text.strip()
            except ImportError:
                raise ValueError("python-docx not installed. Cannot process DOCX files.")
        
        except Exception as e:
            logger.error(f"DOCX extraction error: {str(e)}")
            raise
    
    def chunk_text(self, text: str, chunk_size: int = 4000, overlap: int = 200) -> list:
        """
        Split text into chunks for processing
        
        Args:
            text: Text to chunk
            chunk_size: Maximum chunk size
            overlap: Overlap between chunks
        
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        
        return chunks
    
    def get_document_stats(self, text: str) -> dict:
        """
        Get statistics about the document
        
        Args:
            text: Document text
        
        Returns:
            Dictionary with document statistics
        """
        words = text.split()
        sentences = text.split('.')
        paragraphs = text.split('\n\n')
        
        return {
            "characters": len(text),
            "words": len(words),
            "sentences": len(sentences),
            "paragraphs": len(paragraphs),
            "avg_word_length": sum(len(word) for word in words) / len(words) if words else 0,
            "avg_sentence_length": len(words) / len(sentences) if sentences else 0
        }
