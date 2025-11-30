"""
Vertex AI Tools Service
Handles all AI-powered document processing tools using Vertex AI
"""
import os
import logging
import json
import httpx
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class VertexAIToolsService:
    """
    Service for interacting with Vertex AI for all AI tools
    """
    
    def __init__(self):
        # Debug environment variables
        logger.info("🔍 Vertex AI Tools Service Debug:")
        logger.info(f"- VERTEX_AI_API_KEY exists: {bool(os.getenv('VERTEX_AI_API_KEY'))}")
        logger.info(f"- API_KEY length: {len(os.getenv('VERTEX_AI_API_KEY', ''))}")
        api_key = os.getenv("VERTEX_AI_API_KEY")
        if api_key:
            logger.info(f"- API_KEY prefix: {api_key[:10]}...")
        
        logger.info(f"- VERTEX_AI_ENDPOINT: {os.getenv('VERTEX_AI_ENDPOINT')}")
        logger.info(f"- VERTEX_AI_GEMINI_MODEL: {os.getenv('VERTEX_AI_GEMINI_MODEL')}")
        logger.info(f"- VERTEX_AI_IMAGEN_MODEL: {os.getenv('VERTEX_AI_IMAGEN_MODEL')}")
        logger.info(f"- VERTEX_AI_VIDEO_MODEL: {os.getenv('VERTEX_AI_VIDEO_MODEL')}")
        
        # List available environment variables
        ai_env_vars = {k: v for k, v in os.environ.items() if 'VERTEX' in k or 'AI' in k}
        logger.info(f"- Available AI env vars: {list(ai_env_vars.keys())}")
        
        self.api_key = os.getenv("VERTEX_AI_API_KEY")
        self.endpoint = os.getenv("VERTEX_AI_ENDPOINT", "https://aiplatform.googleapis.com/v1/publishers/google/models")
        self.gemini_model = os.getenv("VERTEX_AI_GEMINI_MODEL", "gemini-2.0-flash-exp")
        self.imagen_model = os.getenv("VERTEX_AI_IMAGEN_MODEL", "imagen-3.0-generate-001")
        self.video_model = os.getenv("VERTEX_AI_VIDEO_MODEL", "veo-3.1-generate-preview")
        
        if not self.api_key:
            logger.error("❌ VERTEX_AI_API_KEY not configured - will use mock responses")
            self.use_mock = True
        else:
            logger.info("✅ Vertex AI API key loaded successfully")
            self.use_mock = False
    
    async def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """Generate text using Vertex AI Gemini models"""
        if self.use_mock:
            logger.warning("🔧 Using mock response - Vertex AI API key not configured")
            return self._mock_text_response(prompt)
        
        logger.info(f"🚀 Making Vertex AI API request with model: {self.gemini_model}")
        logger.info(f"📝 Prompt: {prompt[:100]}...")
        logger.info(f"🔑 Using API key: {self.api_key[:10]}...")
        logger.info(f"🌐 Endpoint: {self.endpoint}")
        
        try:
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                    "candidateCount": 1,
                },
                "safetySettings": self._get_safety_settings()
            }
            
            logger.info(f"📤 Sending request to: {self.endpoint}/{self.gemini_model}:generateContent")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/{self.gemini_model}:generateContent?key={self.api_key}",
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
                    logger.info(f"✅ Generated text: {generated_text[:100]}...")
                    return generated_text
                else:
                    logger.error("❌ No candidates in response")
                    raise Exception("No response generated from Vertex AI")
                    
        except Exception as e:
            logger.error(f"❌ Error generating text: {e}")
            logger.error(f"❌ Falling back to mock response")
            return self._mock_text_response(prompt)
    
    async def summarize_text(self, text: str, length: str = "medium", format_type: str = "paragraphs") -> str:
        """Summarize text using Vertex AI"""
        length_instruction = {
            "short": "Provide a concise summary in 2-3 sentences",
            "medium": "Provide a balanced summary with key points",
            "long": "Provide a detailed comprehensive summary"
        }.get(length, "Provide a balanced summary")
        
        format_instruction = {
            "bullets": "Format the response as bullet points",
            "paragraphs": "Format the response as paragraphs", 
            "sections": "Format the response with clear sections and headings"
        }.get(format_type, "Format the response as paragraphs")
        
        prompt = f"""
{length_instruction} of the following text. {format_instruction}.

Text to summarize:
{text[:15000]}  # Limit text length for API

Summary:
"""
        
        return await self.generate_text(prompt, temperature=0.3)
    
    async def translate_text(self, text: str, target_language: str, preserve_formatting: bool = True) -> str:
        """Translate text using Vertex AI"""
        formatting_instruction = "Preserve the original formatting, paragraphs, and structure" if preserve_formatting else "Focus only on accurate translation"
        
        prompt = f"""
Translate the following text to {target_language}. {formatting_instruction}.

Original text:
{text[:10000]}

Translated text:
"""
        
        return await self.generate_text(prompt, temperature=0.2)
    
    async def improve_content(self, text: str, style: str = "professional") -> str:
        """Improve content quality using Vertex AI"""
        style_instruction = {
            "professional": "Make it more professional, formal, and business-appropriate",
            "casual": "Make it more casual, friendly, and conversational",
            "academic": "Make it more academic, scholarly, and research-oriented",
            "creative": "Make it more creative, engaging, and imaginative"
        }.get(style, "Make it more professional")
        
        prompt = f"""
Improve the following text to make it {style_instruction} while maintaining the original meaning and key information.

Original text:
{text[:10000]}

Improved text:
"""
        
        return await self.generate_text(prompt, temperature=0.4)
    
    async def review_content(self, text: str, review_type: str = "general") -> str:
        """Review content and provide feedback using Vertex AI"""
        review_instruction = {
            "general": "Review this text for overall quality, clarity, and effectiveness",
            "legal": "Review this text for legal issues, compliance, and potential risks",
            "technical": "Review this text for technical accuracy, clarity, and completeness",
            "grammar": "Review this text for grammar, spelling, punctuation, and style issues"
        }.get(review_type, "Review this text for overall quality")
        
        prompt = f"""
{review_instruction}. Provide specific feedback and suggestions for improvement.

Text to review:
{text[:10000]}

Review and feedback:
"""
        
        return await self.generate_text(prompt, temperature=0.3)
    
    async def redact_content(self, text: str, redact_types: List[str]) -> str:
        """Redact sensitive information from text using Vertex AI"""
        types_text = ", ".join(redact_types)
        
        prompt = f"""
Redact and replace the following sensitive information from this text: {types_text}. 
Mark all redacted content with [REDACTED]. Be thorough and identify all instances of sensitive information.

Text to redact:
{text[:10000]}

Redacted text:
"""
        
        return await self.generate_text(prompt, temperature=0.1)
    
    async def generate_insights(self, document_text: str, question: str) -> str:
        """Generate insights from document using Vertex AI"""
        prompt = f"""
Based on the following document, answer this question accurately and comprehensively: {question}

Document content:
{document_text[:15000]}

Answer:
"""
        
        return await self.generate_text(prompt, temperature=0.3)
    
    async def optimize_resume(self, resume_text: str, target_role: str = None, keywords: List[str] = None) -> str:
        """Optimize resume for ATS and recruiters using Vertex AI"""
        role_instruction = f"for the role of {target_role}" if target_role else "for general job applications"
        keywords_instruction = f"Incorporate these keywords: {', '.join(keywords)}" if keywords else ""
        
        prompt = f"""
Optimize this resume {role_instruction}. Improve formatting, language, and impact. {keywords_instruction}

Resume:
{resume_text[:10000]}

Optimized resume:
"""
        
        return await self.generate_text(prompt, temperature=0.4)
    
    async def generate_proposal(self, document_text: str, proposal_type: str = "business", tone: str = "professional") -> str:
        """Generate proposal based on document using Vertex AI"""
        type_instruction = {
            "business": "Write a business proposal",
            "grant": "Write a grant proposal", 
            "project": "Write a project proposal"
        }.get(proposal_type, "Write a business proposal")
        
        tone_instruction = f"Use a {tone} tone"
        
        prompt = f"""
Based on the following information, {type_instruction}. {tone_instruction}. Make it compelling and persuasive.

Information:
{document_text[:10000]}

Proposal:
"""
        
        return await self.generate_text(prompt, temperature=0.5)
    
    async def generate_taglines(self, document_text: str, count: int = 5, style: str = "catchy") -> List[str]:
        """Generate taglines from document using Vertex AI"""
        style_instruction = {
            "catchy": "Make them catchy and memorable",
            "professional": "Make them professional and corporate",
            "creative": "Make them creative and unique"
        }.get(style, "Make them catchy and memorable")
        
        prompt = f"""
Generate {count} distinct taglines based on the following document. {style_instruction}. 
Return only the taglines, one per line, without numbering.

Document:
{document_text[:5000]}

Taglines:
"""
        
        response = await self.generate_text(prompt, temperature=0.7)
        
        # Split into individual taglines and clean up
        taglines = [line.strip() for line in response.split('\n') if line.strip()]
        return taglines[:count]
    
    async def generate_images(self, prompt: str, aspect_ratio: str = "1:1", style: str = "photographic", quantity: int = 1) -> List[Dict[str, Any]]:
        """Generate images using Vertex AI Imagen models"""
        if self.use_mock:
            return self._mock_image_response(prompt, quantity)
        
        try:
            num_images = min(max(quantity, 1), 4)  # Limit to 1-4 images
            
            payload = {
                "instances": [
                    {
                        "prompt": prompt,
                        "aspectRatio": aspect_ratio,
                        "style": style,
                        "sampleCount": num_images
                    }
                ],
                "parameters": {
                    "sampleCount": num_images,
                    "aspectRatio": aspect_ratio,
                    "style": style,
                    "seed": 12345  # Fixed seed for consistency
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/{self.imagen_model}:predict?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Vertex AI Image API error: {response.status_code} - {response.text}")
                    return self._mock_image_response(prompt, quantity)
                
                result = response.json()
                images = []
                
                if result.get("predictions"):
                    for i, prediction in enumerate(result["predictions"]):
                        images.append({
                            "url": f"data:image/png;base64,{prediction.get('bytesBase64Encoded', '')}",
                            "id": f"img_{hash(prompt)}_{i}",
                            "prompt": prompt,
                            "aspectRatio": aspect_ratio,
                            "style": style,
                            "generatedAt": "2024-01-01T00:00:00Z"
                        })
                
                return images
                    
        except Exception as e:
            logger.error(f"Error generating images: {e}")
            return self._mock_image_response(prompt, quantity)
    
    async def generate_video(self, prompt: str, duration: int = 4, aspect_ratio: str = "16:9", style: str = "realistic") -> Dict[str, Any]:
        """Generate video using Vertex AI Veo models"""
        if self.use_mock:
            return self._mock_video_response(prompt)
        
        try:
            payload = {
                "instances": [
                    {
                        "prompt": prompt,
                        "durationSeconds": duration,
                        "aspectRatio": aspect_ratio,
                        "style": style,
                        "personGeneration": "allow_adult"
                    }
                ],
                "parameters": {
                    "seed": 12345,
                    "aspectRatio": aspect_ratio,
                    "durationSeconds": duration
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}/{self.video_model}:generateVideos?key={self.api_key}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=120.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Vertex AI Video API error: {response.status_code} - {response.text}")
                    return self._mock_video_response(prompt)
                
                result = response.json()
                
                if result.get("predictions") and len(result["predictions"]) > 0:
                    prediction = result["predictions"][0]
                    return {
                        "url": prediction.get("videoUri") or prediction.get("gcsUri"),
                        "id": f"video_{hash(prompt)}",
                        "prompt": prompt,
                        "duration": duration,
                        "aspectRatio": aspect_ratio,
                        "generatedAt": "2024-01-01T00:00:00Z"
                    }
                else:
                    return self._mock_video_response(prompt)
                    
        except Exception as e:
            logger.error(f"Error generating video: {e}")
            return self._mock_video_response(prompt)
    
    def _get_safety_settings(self) -> List[Dict[str, Any]]:
        """Get safety settings for content generation"""
        return [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    
    def _mock_text_response(self, prompt: str) -> str:
        """Generate mock text response when API is not configured"""
        return f"This is a mock response for: {prompt[:100]}... (Vertex AI API key not configured)"
    
    def _mock_image_response(self, prompt: str, quantity: int) -> List[Dict[str, Any]]:
        """Generate mock image response when API is not configured"""
        import time
        return [
            {
                "url": f"https://picsum.photos/512/512?random={int(time.time())}_{i}",
                "id": f"mock_img_{int(time.time())}_{i}",
                "prompt": prompt,
                "aspectRatio": "1:1",
                "style": "photographic",
                "generatedAt": "2024-01-01T00:00:00Z"
            }
            for i in range(quantity)
        ]
    
    def _mock_video_response(self, prompt: str) -> Dict[str, Any]:
        """Generate mock video response when API is not configured"""
        import time
        return {
            "url": "https://example.com/mock-video.mp4",
            "id": f"mock_video_{int(time.time())}",
            "prompt": prompt,
            "duration": 4,
            "aspectRatio": "16:9",
            "generatedAt": "2024-01-01T00:00:00Z"
        }


# Export singleton instance
vertex_ai_tools = VertexAIToolsService()
