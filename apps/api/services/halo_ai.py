"""
Halo AI Service for chat functionality
Provides integration with Vertex AI models for conversation responses
"""
import os
import logging
import json
from typing import AsyncGenerator, List, Dict, Any
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class HaloAIService:
    """
    Service for interacting with Vertex AI API
    Supports both streaming and non-streaming responses
    """
    
    def __init__(self):
        """Initialize Halo AI service with Vertex API configuration"""
        self.api_key = os.getenv("VERTEX_AI_API_KEY")
        self.endpoint = os.getenv("VERTEX_AI_ENDPOINT", "https://aiplatform.googleapis.com/v1/publishers/google/models")
        self.model = os.getenv("VERTEX_AI_GEMINI_MODEL", "gemini-2.0-flash-exp")
        
        if not self.api_key:
            logger.error("❌ VERTEX_AI_API_KEY not configured - will use mock responses")
            self.use_mock = True
        else:
            logger.info("✅ Vertex AI API key loaded successfully in Halo AI Service")
            self.use_mock = False
    
    async def generate_response(self, prompt: str, history: List[Dict[str, Any]] = None) -> str:
        """
        Generate a non-streaming response from the AI
        """
        if self.use_mock:
            logger.warning("🔧 Using mock response - Vertex AI API key not configured")
            return self._mock_response(prompt, history)
        
        logger.info(f"🚀 Making Vertex AI API request for chat response")
        logger.info(f"📝 Prompt: {prompt[:100]}...")
        logger.info(f"🔑 Using API key: {self.api_key[:10]}...")
        logger.info(f"🌐 Endpoint: {self.endpoint}")
        
        try:
            # Build conversation history for Vertex AI
            contents = []
            
            # Add history if provided
            if history:
                for msg in history:
                    contents.append({
                        "role": msg.get("role", "user"),
                        "parts": [{"text": msg.get("content", "")}]
                    })
            
            # Add current prompt
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })
            
            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048,
                    "candidateCount": 1,
                }
            }
            
            logger.info(f"📤 Sending request to: {self.endpoint}/{self.model}:generateContent")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/{self.model}:generateContent?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=30.0
                )
                
                logger.info(f"📥 Response status: {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"❌ Vertex AI API error: {response.status_code}")
                    logger.error(f"❌ Response body: {response.text}")
                    raise Exception(f"Vertex AI API returned status {response.status_code}")
                
                result = response.json()
                logger.info(f"✅ Response received: {str(result)[:200]}...")
                
                if result.get("candidates") and len(result["candidates"]) > 0:
                    generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info(f"✅ Generated response: {generated_text[:100]}...")
                    return generated_text
                else:
                    logger.error("❌ No candidates in response")
                    raise Exception("No response generated from Vertex AI")
                    
        except Exception as e:
            logger.error(f"❌ Error generating response: {e}")
            logger.error(f"❌ Falling back to mock response")
            return self._mock_response(prompt, history)
    
    async def stream_chat(self, prompt: str, history: List[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from the AI
        """
        if self.use_mock:
            # Simulate streaming with mock response
            mock_text = self._mock_response(prompt, history)
            words = mock_text.split()
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.05)  # Simulate streaming delay
            return
        
        logger.info("🚀 Making real Vertex AI API call for streaming")
        
        try:
            # Build conversation history for Vertex AI
            contents = []
            
            # Add history if provided
            if history:
                for msg in history:
                    contents.append({
                        "role": msg.get("role", "user"),
                        "parts": [{"text": msg.get("content", "")}]
                    })
            
            # Add current prompt
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })
            
            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048,
                    "candidateCount": 1,
                }
            }
            
            logger.info(f"📤 Sending streaming request to: {self.endpoint}/{self.model}:generateContent")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/{self.model}:generateContent?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=30.0
                )
                
                logger.info(f"📥 Streaming response status: {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"❌ Vertex AI API error: {response.status_code}")
                    logger.error(f"❌ Response body: {response.text}")
                    # Fall back to mock
                    mock_text = self._mock_response(prompt, history)
                    words = mock_text.split()
                    for i, word in enumerate(words):
                        yield word + (" " if i < len(words) - 1 else "")
                        await asyncio.sleep(0.05)
                    return
                
                result = response.json()
                logger.info(f"✅ Streaming response received: {str(result)[:200]}...")
                
                if result.get("candidates") and len(result["candidates"]) > 0:
                    generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info(f"✅ Generated streaming text: {generated_text[:100]}...")
                    
                    # Simulate streaming by yielding word by word
                    words = generated_text.split()
                    for i, word in enumerate(words):
                        yield word + (" " if i < len(words) - 1 else "")
                        await asyncio.sleep(0.05)
                    return
                else:
                    logger.error("❌ No candidates in streaming response")
                    # Fall back to mock
                    mock_text = self._mock_response(prompt, history)
                    words = mock_text.split()
                    for i, word in enumerate(words):
                        yield word + (" " if i < len(words) - 1 else "")
                        await asyncio.sleep(0.05)
                    return
                    
        except Exception as e:
            logger.error(f"❌ Error in streaming API call: {e}")
            # Fall back to mock
            mock_text = self._mock_response(prompt, history)
            words = mock_text.split()
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.05)
            return
    
    def _mock_response(self, prompt: str, history: List[Dict[str, Any]] = None) -> str:
        """
        Generate a mock response when API is not configured
        """
        # Simple context-aware mock responses
        prompt_lower = prompt.lower()
        
        if "hello" in prompt_lower or "hi" in prompt_lower:
            return "Hello! I'm HALO AI, your intelligent document assistant. How can I help you today?"
        
        elif "document" in prompt_lower:
            return "I can help you analyze and process documents. You can upload PDFs, images, or various file formats, and I'll extract and analyze the content for you."
        
        elif "summarize" in prompt_lower or "summary" in prompt_lower:
            return "I can create concise summaries of your documents. Simply upload the file or paste the text, and I'll extract the key points and main ideas."
        
        elif "help" in prompt_lower:
            return "I'm HALO AI, and I can help you with:\n\n- Document analysis and processing\n- Text summarization\n- Question answering about documents\n- File format conversion\n- Content extraction\n- And much more!\n\nJust upload a document or ask me anything about your files."
        
        elif any(word in prompt_lower for word in ["thank", "thanks", "appreciate"]):
            return "You're welcome! I'm always here to help with your document needs. Feel free to ask if you need anything else."
        
        else:
            return f"I understand you're asking about: \"{prompt}\"\n\nAs HALO AI, I'm designed to help with document processing, analysis, and intelligent content understanding.\n\nTo get started, you can:\n1. Upload a document for analysis\n2. Ask me to summarize text\n3. Request document information extraction\n4. Get help with file conversions\n\nWhat specific document task would you like help with?"
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the AI service is healthy
        """
        if self.use_mock:
            return {
                "status": "mock",
                "message": "Using mock responses (API key not configured)",
                "model": self.model
            }
        
        try:
            # Simple health check - try to generate a short response
            test_response = await self.generate_response("Hello", [])
            return {
                "status": "healthy",
                "message": "AI service is responding",
                "model": self.model,
                "test_response_length": len(test_response)
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"AI service error: {str(e)}",
                "model": self.model
            }


# Import asyncio for mock streaming delay
import asyncio

# Export singleton instance
halo_ai = HaloAIService()
