"""
AI Tools Service
Implements AI-powered document tools
"""
import logging
import re
from typing import List, Tuple
from services.halo_ai import HaloAIService

logger = logging.getLogger(__name__)

class AIToolsService:
    """Service for AI-powered document tools"""
    
    def __init__(self):
        self.halo_ai = HaloAIService()
    
    async def summarize(
        self,
        text: str,
        length: str = "medium",
        format: str = "bullets"
    ) -> str:
        """
        Summarize text using AI
        
        Args:
            text: Text to summarize
            length: Summary length (short, medium, long)
            format: Output format (bullets, paragraphs, sections)
        
        Returns:
            Summary text
        """
        length_instructions = {
            "short": "in 3-5 sentences",
            "medium": "in 2-3 paragraphs or 8-10 bullet points",
            "long": "in 4-5 paragraphs or 15-20 bullet points"
        }
        
        format_instructions = {
            "bullets": "as bullet points",
            "paragraphs": "in paragraph form",
            "sections": "organized into clear sections with headings"
        }
        
        prompt = f"""Please summarize the following text {length_instructions[length]} {format_instructions[format]}:

{text}

Summary:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto"
    ) -> str:
        """
        Translate text to another language
        
        Args:
            text: Text to translate
            target_language: Target language
            source_language: Source language (auto-detect if "auto")
        
        Returns:
            Translated text
        """
        if source_language == "auto":
            prompt = f"""Please translate the following text to {target_language}. Maintain the original formatting and tone:

{text}

Translation:"""
        else:
            prompt = f"""Please translate the following text from {source_language} to {target_language}. Maintain the original formatting and tone:

{text}

Translation:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def improve_content(
        self,
        text: str,
        style: str = "professional"
    ) -> str:
        """
        Improve and rewrite content
        
        Args:
            text: Text to improve
            style: Target style (professional, casual, academic, creative)
        
        Returns:
            Improved text
        """
        style_instructions = {
            "professional": "professional and business-appropriate",
            "casual": "casual and conversational",
            "academic": "academic and scholarly",
            "creative": "creative and engaging"
        }
        
        prompt = f"""Please rewrite and improve the following text to be more {style_instructions[style]}. 
Enhance clarity, fix grammar, improve structure, and make it more impactful:

{text}

Improved version:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def redact_sensitive_data(
        self,
        text: str,
        redact_types: List[str]
    ) -> Tuple[str, dict]:
        """
        Detect and redact sensitive information
        
        Args:
            text: Text to redact
            redact_types: Types of data to redact
        
        Returns:
            Tuple of (redacted_text, found_items)
        """
        found_items = {}
        redacted_text = text
        
        # Email addresses
        if "email" in redact_types:
            emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
            found_items["emails"] = len(emails)
            redacted_text = re.sub(
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                '[EMAIL REDACTED]',
                redacted_text
            )
        
        # Phone numbers
        if "phone" in redact_types:
            phones = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)
            found_items["phones"] = len(phones)
            redacted_text = re.sub(
                r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
                '[PHONE REDACTED]',
                redacted_text
            )
        
        # SSN
        if "ssn" in redact_types:
            ssns = re.findall(r'\b\d{3}-\d{2}-\d{4}\b', text)
            found_items["ssns"] = len(ssns)
            redacted_text = re.sub(
                r'\b\d{3}-\d{2}-\d{4}\b',
                '[SSN REDACTED]',
                redacted_text
            )
        
        # Credit card numbers
        if "credit_card" in redact_types:
            cards = re.findall(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', text)
            found_items["credit_cards"] = len(cards)
            redacted_text = re.sub(
                r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
                '[CREDIT CARD REDACTED]',
                redacted_text
            )
        
        # Use AI for additional sensitive data detection
        prompt = f"""Please identify any additional sensitive information in the following text that should be redacted 
(such as names, addresses, account numbers, etc.) and replace them with [REDACTED]:

{redacted_text}

Redacted version:"""
        
        ai_redacted = await self.halo_ai.generate_response(prompt)
        
        return ai_redacted, found_items
    
    async def review_document(
        self,
        text: str,
        review_type: str = "general"
    ) -> str:
        """
        Review document and provide suggestions
        
        Args:
            text: Document text
            review_type: Type of review (general, legal, technical, business)
        
        Returns:
            Review with suggestions
        """
        review_instructions = {
            "general": "general writing quality, clarity, and structure",
            "legal": "legal accuracy, completeness, and potential issues",
            "technical": "technical accuracy, clarity, and completeness",
            "business": "business value, clarity, and professional tone"
        }
        
        prompt = f"""Please review the following document for {review_instructions[review_type]}.
Provide specific suggestions for improvement:

{text}

Review and Suggestions:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def get_insights(
        self,
        text: str,
        question: str = None
    ) -> str:
        """
        Get AI insights from document
        
        Args:
            text: Document text
            question: Optional specific question
        
        Returns:
            Insights or answer
        """
        if question:
            prompt = f"""Based on the following document, please answer this question: {question}

Document:
{text}

Answer:"""
        else:
            prompt = f"""Please analyze the following document and provide key insights, main themes, and important takeaways:

{text}

Insights:"""
        
        return await self.halo_ai.generate_response(prompt)
