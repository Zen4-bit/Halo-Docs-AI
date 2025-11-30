"""
Google Vertex AI Client - Direct Integration
Handles all AI requests to Google Vertex AI endpoints
"""
import os
import httpx
import json
import logging
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class VertexAIClient:
    """Direct Google Vertex AI client for all AI operations"""
    
    def __init__(self):
        self.api_key = os.getenv("VERTEX_AI_API_KEY") or os.getenv("HALO_AI_API_KEY")
        self.base_url = "https://aiplatform.googleapis.com/v1/publishers/google/models"
        
        if not self.api_key:
            raise ValueError("No Vertex AI API key found. Please set VERTEX_AI_API_KEY or HALO_AI_API_KEY")
    
    async def generate_text(
        self, 
        prompt: str, 
        model: str = "gemini-2.5-flash-lite",
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        """Generate text using Gemini model"""
        
        url = f"{self.base_url}/{model}:streamGenerateContent?key={self.api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "candidateCount": 1
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Log the exact request being sent
                print(f"🔍 Vertex AI Request URL: {url}")
                print(f"🔍 Vertex AI Request Body: {json.dumps(payload, indent=2)}")
                print(f"🔍 Vertex AI Request Headers: {json.dumps({'Content-Type': 'application/json'}, indent=2)}")
                
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                # Log response details
                print(f"🔍 Vertex AI Response Status: {response.status_code}")
                print(f"🔍 Vertex AI Response Body: {response.text}")
                
                response.raise_for_status()
                
                # Parse response - Vertex AI returns JSON, not streaming SSE
                data = response.json()
                
                # Handle both single response and array of responses
                if isinstance(data, list):
                    # Multiple responses (streaming)
                    result = ""
                    for item in data:
                        if 'candidates' in item and item['candidates']:
                            candidate = item['candidates'][0]
                            if 'content' in candidate and 'parts' in candidate['content']:
                                text = candidate['content']['parts'][0].get('text', '')
                                result += text
                    return result or "No response generated."
                else:
                    # Single response
                    if 'candidates' in data and data['candidates']:
                        candidate = data['candidates'][0]
                        if 'content' in candidate and 'parts' in candidate['content']:
                            return candidate['content']['parts'][0].get('text', 'No response generated.')
                    
                    return "No response generated."
                
        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            print(f"❌ Vertex AI HTTP Error: {e.response.status_code} - {error_text}")
            logger.error(f"Vertex AI API error: {e.response.status_code} - {error_text}")
            
            # Parse error response for better user feedback
            try:
                error_data = json.loads(error_text)
                if e.response.status_code == 429:
                    return "⚠️ **Vertex AI Quota Exceeded**\n\nYou've reached the API quota limit. Please wait 24 hours for the quota to reset, or increase your quota limits in Google Cloud Console.\n\nError: " + error_data.get('error', {}).get('message', 'Quota exceeded')
                elif e.response.status_code == 403:
                    return "🔒 **Access Denied**\n\nThe API key doesn't have permission to access this resource. Please check your Google Cloud project permissions.\n\nError: " + error_data.get('error', {}).get('message', 'Permission denied')
                elif e.response.status_code == 400:
                    return "❌ **Invalid Request**\n\nThe request format is incorrect. Please check the API documentation.\n\nError: " + error_data.get('error', {}).get('message', 'Bad request')
                else:
                    return f"❌ **Vertex AI Error ({e.response.status_code})**\n\n{error_data.get('error', {}).get('message', error_text)}"
            except:
                return f"API Error {e.response.status_code}: {error_text}"
                
        except Exception as e:
            print(f"❌ Vertex AI Client Error: {e}")
            logger.error(f"Vertex AI client error: {e}")
            return f"Error: {str(e)}"
    
    async def generate_image(
        self, 
        prompt: str, 
        aspect_ratio: str = "1:1",
        style: str = "photographic",
        number_of_images: int = 1
    ) -> Dict[str, Any]:
        """Generate images using Imagen model"""
        
        url = f"{self.base_url}/imagen-3.0-generate-001:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"Generate {number_of_images} image(s) of: {prompt}. Style: {style}. Aspect ratio: {aspect_ratio}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "candidateCount": min(number_of_images, 4),  # Limit to 4
                "temperature": 0.4
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                
                data = response.json()
                
                # Process image generation response
                images = []
                if 'candidates' in data:
                    for candidate in data['candidates']:
                        if 'content' in candidate and 'parts' in candidate['content']:
                            for part in candidate['content']['parts']:
                                if 'inlineData' in part and 'data' in part['inlineData']:
                                    images.append({
                                        "base64_data": part['inlineData']['data'],
                                        "caption": f"Generated image: {prompt}"
                                    })
                
                return {
                    "images": images,
                    "prompt": prompt,
                    "style": style,
                    "aspect_ratio": aspect_ratio
                }
                
        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            logger.error(f"Imagen API error: {e.response.status_code} - {error_text}")
            
            # Parse error response for better user feedback
            try:
                error_data = json.loads(error_text)
                if e.response.status_code == 429:
                    error_msg = "⚠️ **Vertex AI Quota Exceeded**\n\nYou've reached the API quota limit for image generation. Please wait 24 hours or increase your quota limits in Google Cloud Console.\n\nError: " + error_data.get('error', {}).get('message', 'Quota exceeded')
                elif e.response.status_code == 403:
                    error_msg = "🔒 **Access Denied**\n\nThe API key doesn't have permission for image generation. Please check your Google Cloud project permissions.\n\nError: " + error_data.get('error', {}).get('message', 'Permission denied')
                elif e.response.status_code == 400:
                    error_msg = "❌ **Invalid Request**\n\nThe image generation request format is incorrect.\n\nError: " + error_data.get('error', {}).get('message', 'Bad request')
                else:
                    error_msg = f"❌ **Vertex AI Error ({e.response.status_code})**\n\n{error_data.get('error', {}).get('message', error_text)}"
                return {"error": error_msg, "images": []}
            except:
                return {"error": f"API Error {e.response.status_code}: {error_text}", "images": []}
                
        except Exception as e:
            logger.error(f"Imagen client error: {e}")
            return {"error": f"Error: {str(e)}", "images": []}
    
    async def generate_video(
        self, 
        prompt: str, 
        duration: int = 5,
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        """Generate video using Veo model"""
        
        url = f"{self.base_url}/veo-3.1-generate-preview:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"Generate a {duration}-second video of: {prompt}. Aspect ratio: {aspect_ratio}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "candidateCount": 1,
                "temperature": 0.3
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                
                data = response.json()
                
                # Process video generation response
                if 'candidates' in data and data['candidates']:
                    candidate = data['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        for part in candidate['content']['parts']:
                            if 'inlineData' in part and 'data' in part['inlineData']:
                                return {
                                    "video_url": f"data:video/mp4;base64,{part['inlineData']['data']}",
                                    "prompt": prompt,
                                    "duration": duration,
                                    "aspect_ratio": aspect_ratio
                                }
                
                return {"error": "No video generated"}
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Veo API error: {e.response.status_code} - {e.response.text}")
            return {"error": f"API Error: {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Veo client error: {e}")
            return {"error": f"Error: {str(e)}"}
    
    async def summarize_text(self, text: str, summary_type: str = "concise") -> str:
        """Summarize text using Gemini"""
        
        prompt = f"""
        Please provide a {summary_type} summary of the following text:
        
        {text}
        
        Summary:
        """
        
        return await self.generate_text(prompt, temperature=0.3)
    
    async def translate_text(self, text: str, target_language: str = "English") -> str:
        """Translate text using Gemini"""
        
        prompt = f"""
        Please translate the following text to {target_language}:
        
        {text}
        
        Translation:
        """
        
        return await self.generate_text(prompt, temperature=0.2)
    
    async def improve_text(self, text: str, improvement_type: str = "general") -> str:
        """Improve text using Gemini"""
        
        prompts = {
            "general": "Please improve the following text for clarity, grammar, and style:",
            "professional": "Please rewrite the following text in a more professional tone:",
            "concise": "Please make the following text more concise while preserving meaning:",
            "academic": "Please rewrite the following text in an academic style:"
        }
        
        prompt = f"{prompts.get(improvement_type, prompts['general'])}\n\n{text}\n\nImproved version:"
        
        return await self.generate_text(prompt, temperature=0.4)
    
    async def review_text(self, text: str) -> Dict[str, Any]:
        """Review text and provide feedback using Gemini"""
        
        prompt = f"""
        Please review the following text and provide detailed feedback on:
        1. Grammar and spelling
        2. Clarity and readability
        3. Structure and flow
        4. Overall quality
        5. Suggestions for improvement
        
        Text: {text}
        
        Please provide your review in JSON format with keys: grammar, clarity, structure, overall_quality, suggestions.
        """
        
        try:
            response = await self.generate_text(prompt, temperature=0.3)
            
            # Try to parse as JSON, fallback to text if needed
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                return {"review": response}
                
        except Exception as e:
            return {"error": f"Review failed: {str(e)}"}
    
    async def analyze_image(self, image_data: str, analysis_type: str = "general") -> str:
        """Analyze image using Gemini Vision"""
        
        url = f"{self.base_url}/gemini-2.5-flash-lite:generateContent?key={self.api_key}"
        
        prompt = f"Please provide a {analysis_type} analysis of this image."
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": prompt
                        },
                        {
                            "inlineData": {
                                "mimeType": "image/jpeg",
                                "data": image_data
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 1024
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                
                data = response.json()
                
                if 'candidates' in data and data['candidates']:
                    candidate = data['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        return candidate['content']['parts'][0].get('text', 'No analysis generated.')
                
                return "No analysis generated."
                
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return f"Error: {str(e)}"

# Global client instance
vertex_client = VertexAIClient()
