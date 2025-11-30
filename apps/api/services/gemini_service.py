"""
Gemini AI Service with Dynamic Model Selection
Automatically chooses the best model based on task requirements
"""
import os
import json
import base64
import asyncio
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator, Union
from pathlib import Path
from enum import Enum
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDAWqcNvlIkLDpNxiueuDnW2iXwxDA0ikY")
genai.configure(api_key=GEMINI_API_KEY)
logger.info(f"Gemini API configured with key: {GEMINI_API_KEY[:10]}...")


class TaskType(Enum):
    """Task types for model selection"""
    CHAT_SIMPLE = "chat_simple"
    CHAT_COMPLEX = "chat_complex"
    SUMMARIZATION = "summarization"
    TRANSLATION = "translation"
    REWRITING = "rewriting"
    INSIGHTS = "insights"
    DOCUMENT_ANALYSIS = "document_analysis"
    IMAGE_ANALYSIS = "image_analysis"
    IMAGE_GENERATION = "image_generation"
    VIDEO_ANALYSIS = "video_analysis"
    CODE_GENERATION = "code_generation"
    CREATIVE = "creative"


class GeminiModelConfig:
    """Model configurations and capabilities"""
    
    # Available models with capabilities
    MODELS = {
        "gemini-2.0-flash-exp": {
            "name": "gemini-2.0-flash-exp",
            "supports_vision": True,
            "supports_streaming": True,
            "max_tokens": 8192,
            "speed": "fast",
            "reasoning": "medium",
            "best_for": [TaskType.CHAT_SIMPLE, TaskType.TRANSLATION, TaskType.REWRITING]
        },
        "gemini-1.5-flash": {
            "name": "gemini-1.5-flash",
            "supports_vision": True,
            "supports_streaming": True,
            "max_tokens": 8192,
            "speed": "fast",
            "reasoning": "medium",
            "best_for": [TaskType.CHAT_SIMPLE, TaskType.TRANSLATION, TaskType.REWRITING]
        },
        "gemini-1.5-flash-8b": {
            "name": "gemini-1.5-flash-8b",
            "supports_vision": True,
            "supports_streaming": True,
            "max_tokens": 8192,
            "speed": "fastest",
            "reasoning": "light",
            "best_for": [TaskType.CHAT_SIMPLE, TaskType.TRANSLATION]
        },
        "gemini-1.5-pro": {
            "name": "gemini-1.5-pro",
            "supports_vision": True,
            "supports_streaming": True,
            "max_tokens": 8192,
            "speed": "medium",
            "reasoning": "high",
            "best_for": [TaskType.CHAT_COMPLEX, TaskType.SUMMARIZATION, TaskType.INSIGHTS, TaskType.DOCUMENT_ANALYSIS]
        },
        "gemini-pro-vision": {
            "name": "gemini-pro-vision",
            "supports_vision": True,
            "supports_streaming": True,
            "max_tokens": 4096,
            "speed": "medium",
            "reasoning": "high",
            "best_for": [TaskType.IMAGE_ANALYSIS]
        },
        "gemini-exp-1206": {
            "name": "gemini-exp-1206",
            "supports_vision": True,
            "supports_streaming": True,
            "max_tokens": 8192,
            "speed": "medium",
            "reasoning": "highest",
            "best_for": [TaskType.CHAT_COMPLEX, TaskType.INSIGHTS, TaskType.CODE_GENERATION, TaskType.CREATIVE]
        }
    }
    
    # Model priority for fallback
    FALLBACK_ORDER = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b"
    ]
    
    @classmethod
    def get_best_model(cls, task_type: TaskType, requires_vision: bool = False, 
                       input_length: int = 0) -> str:
        """Select the best model for the task"""
        
        # For image generation, use specific model
        if task_type == TaskType.IMAGE_GENERATION:
            return "gemini-2.0-flash-exp"  # For image understanding/generation prompts
        
        # Filter models by capability
        suitable_models = []
        for model_name, config in cls.MODELS.items():
            if requires_vision and not config["supports_vision"]:
                continue
            if task_type in config["best_for"]:
                suitable_models.append((model_name, config))
        
        # If no ideal match, use fallback
        if not suitable_models:
            for fallback in cls.FALLBACK_ORDER:
                config = cls.MODELS.get(fallback)
                if config:
                    if requires_vision and not config["supports_vision"]:
                        continue
                    return fallback
        
        # Choose based on input length
        if input_length > 10000:
            # Prefer pro for long inputs
            for model_name, config in suitable_models:
                if config["reasoning"] in ["high", "highest"]:
                    return model_name
        
        # Return first suitable model
        return suitable_models[0][0] if suitable_models else "gemini-1.5-flash"
    
    @classmethod
    def get_model_config(cls, model_name: str) -> Dict[str, Any]:
        """Get model configuration"""
        return cls.MODELS.get(model_name, cls.MODELS["gemini-1.5-flash"])


class GeminiService:
    """Main Gemini AI service with all capabilities"""
    
    def __init__(self):
        self.config = GeminiModelConfig()
        self._models_cache = {}
    
    def _get_model(self, model_name: str, system_instruction: Optional[str] = None):
        """Get or create model instance"""
        cache_key = f"{model_name}_{hash(system_instruction or '')}"
        if cache_key not in self._models_cache:
            kwargs = {"model_name": model_name}
            if system_instruction:
                kwargs["system_instruction"] = system_instruction
            self._models_cache[cache_key] = genai.GenerativeModel(**kwargs)
        return self._models_cache[cache_key]
    
    def _get_safety_settings(self):
        """Get default safety settings"""
        return {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    
    async def generate(
        self,
        prompt: str,
        task_type: TaskType = TaskType.CHAT_SIMPLE,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        images: Optional[List[bytes]] = None,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Generate content with automatic model selection"""
        
        logger.info(f"Generate called - task: {task_type}, stream: {stream}, prompt_len: {len(prompt)}")
        
        requires_vision = images is not None and len(images) > 0
        model_name = self.config.get_best_model(
            task_type, 
            requires_vision=requires_vision,
            input_length=len(prompt)
        )
        
        logger.info(f"Selected model: {model_name}")
        model = self._get_model(model_name, system_instruction)
        
        # Build content - for text-only, just use the prompt string
        if images:
            content = []
            for img_data in images:
                content.append({
                    "mime_type": "image/jpeg",
                    "data": base64.b64encode(img_data).decode() if isinstance(img_data, bytes) else img_data
                })
            content.append(prompt)
        else:
            content = prompt  # Simple string for text-only
        
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens
        )
        
        try:
            if stream:
                # Return async generator for streaming
                async def stream_gen():
                    async for chunk in self._stream_response(model, content, generation_config):
                        yield chunk
                return stream_gen()
            else:
                logger.info("Starting non-streaming generation...")
                # Use thread pool for sync gemini call to prevent blocking
                response = await asyncio.to_thread(
                    model.generate_content,
                    content,
                    generation_config=generation_config,
                    safety_settings=self._get_safety_settings()
                )
                logger.info(f"Response received: {type(response)}")
                if response and response.text:
                    logger.info(f"Response text length: {len(response.text)}")
                    return response.text
                # Handle blocked or empty response
                if response.candidates and response.candidates[0].finish_reason:
                    reason = response.candidates[0].finish_reason
                    logger.warning(f"Response blocked/empty: {reason}")
                    return f"Response was blocked or empty. Reason: {reason}"
                return "No response generated. Please try again."
        except Exception as e:
            logger.error(f"Gemini generate error: {e}", exc_info=True)
            # Try fallback model
            return await self._fallback_generate(prompt, content, generation_config, str(e))
    
    async def _stream_response(self, model, content, generation_config) -> AsyncGenerator[str, None]:
        """Stream response chunks - runs sync generator in thread"""
        try:
            # Run the synchronous streaming call in a thread
            def sync_stream():
                return model.generate_content(
                    content,
                    generation_config=generation_config,
                    safety_settings=self._get_safety_settings(),
                    stream=True
                )
            
            response = await asyncio.to_thread(sync_stream)
            
            # Iterate through chunks using thread
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    await asyncio.sleep(0)  # Allow other async tasks to run
        except Exception as e:
            print(f"Stream error: {e}")
            yield f"Error: {str(e)}"
    
    async def _fallback_generate(self, prompt: str, content: List, 
                                  generation_config, error: str) -> str:
        """Fallback to alternative models on error"""
        print(f"Trying fallback models due to error: {error}")
        for fallback_model in self.config.FALLBACK_ORDER:
            try:
                print(f"Trying fallback model: {fallback_model}")
                model = self._get_model(fallback_model)
                response = await asyncio.to_thread(
                    model.generate_content,
                    content,
                    generation_config=generation_config,
                    safety_settings=self._get_safety_settings()
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                print(f"Fallback model {fallback_model} failed: {e}")
                continue
        # Return error message instead of raising exception
        return f"I apologize, but I couldn't generate a response. Please try again. (Error: {error})"
    
    # ==================== CHAT ====================
    async def chat(
        self,
        message: str,
        history: List[Dict[str, str]] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        personality: str = "helpful",
        images: Optional[List[bytes]] = None,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """AI Chat with personality and history support"""
        
        personalities = {
            "helpful": "You are a helpful, friendly AI assistant.",
            "professional": "You are a professional business consultant. Be formal and precise.",
            "creative": "You are a creative writer. Be imaginative and expressive.",
            "technical": "You are a technical expert. Be detailed and accurate.",
            "casual": "You are a casual friend. Be relaxed and fun.",
            "academic": "You are an academic scholar. Be thorough and cite sources."
        }
        
        base_instruction = personalities.get(personality, personalities["helpful"])
        full_instruction = f"{base_instruction}\n\n{system_instruction or ''}"
        
        # Build conversation context
        context = ""
        if history:
            for msg in history[-10:]:  # Last 10 messages
                role = "User" if msg.get("role") == "user" else "Assistant"
                context += f"{role}: {msg.get('content', '')}\n"
        
        prompt = f"{context}\nUser: {message}\nAssistant:"
        
        task_type = TaskType.CHAT_COMPLEX if len(message) > 500 else TaskType.CHAT_SIMPLE
        
        return await self.generate(
            prompt=prompt,
            task_type=task_type,
            system_instruction=full_instruction,
            temperature=temperature,
            images=images,
            stream=stream
        )
    
    # ==================== SUMMARIZATION ====================
    async def summarize(
        self,
        text: str,
        level: str = "medium",
        style: str = "paragraph",
        language: str = "English",
        extract_topics: bool = False,
        extract_sentiment: bool = False,
        extract_entities: bool = False,
        stream: bool = False
    ) -> Union[str, Dict[str, Any], AsyncGenerator[str, None]]:
        """Summarize text with various options"""
        
        level_instructions = {
            "short": "Provide a very brief summary in 2-3 sentences.",
            "medium": "Provide a comprehensive summary in 1-2 paragraphs.",
            "detailed": "Provide a detailed summary covering all key points."
        }
        
        style_instructions = {
            "paragraph": "Write in paragraph form.",
            "bullets": "Use bullet points for clarity.",
            "numbered": "Use numbered list format.",
            "executive": "Write an executive summary suitable for business leaders."
        }
        
        prompt = f"""Summarize the following text.
{level_instructions.get(level, level_instructions['medium'])}
{style_instructions.get(style, style_instructions['paragraph'])}
Output language: {language}

Text to summarize:
{text}

"""
        
        if extract_topics or extract_sentiment or extract_entities:
            prompt += "\nAlso provide:\n"
            if extract_topics:
                prompt += "- Main topics/themes\n"
            if extract_sentiment:
                prompt += "- Overall sentiment (positive/negative/neutral)\n"
            if extract_entities:
                prompt += "- Key entities (people, organizations, locations)\n"
            prompt += "\nFormat your response as JSON with keys: summary, topics, sentiment, entities"
        
        return await self.generate(
            prompt=prompt,
            task_type=TaskType.SUMMARIZATION,
            stream=stream
        )
    
    # ==================== TRANSLATION ====================
    async def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto",
        tone: str = "neutral",
        preserve_formatting: bool = True,
        sentence_by_sentence: bool = False,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Translate text with tone control"""
        
        tone_instructions = {
            "neutral": "",
            "formal": "Use formal, professional language.",
            "informal": "Use casual, conversational language.",
            "academic": "Use academic, scholarly language.",
            "business": "Use business-appropriate language."
        }
        
        source_note = f"from {source_language}" if source_language != "auto" else "(auto-detect source language)"
        
        prompt = f"""Translate the following text {source_note} to {target_language}.
{tone_instructions.get(tone, '')}
{"Preserve all formatting, line breaks, and structure." if preserve_formatting else ""}
{"Translate sentence by sentence, showing each original sentence followed by its translation." if sentence_by_sentence else ""}

Text to translate:
{text}

Translation:"""
        
        return await self.generate(
            prompt=prompt,
            task_type=TaskType.TRANSLATION,
            stream=stream
        )
    
    # ==================== REWRITING ====================
    async def rewrite(
        self,
        text: str,
        level: str = "medium",
        tone: str = "neutral",
        length_change: str = "same",
        use_emoji: bool = False,
        plagiarism_safe: bool = False,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Rewrite text with various styles"""
        
        level_instructions = {
            "light": "Make minimal changes while improving clarity.",
            "medium": "Rewrite significantly while keeping the core meaning.",
            "aggressive": "Completely restructure and rephrase the content."
        }
        
        tone_instructions = {
            "neutral": "",
            "formal": "Use formal, professional language.",
            "friendly": "Use warm, approachable language.",
            "academic": "Use scholarly, well-researched language.",
            "seo": "Optimize for search engines with keywords.",
            "storytelling": "Use narrative, engaging language.",
            "persuasive": "Use compelling, convincing language."
        }
        
        length_instructions = {
            "shorter": "Make the text significantly shorter.",
            "same": "Keep approximately the same length.",
            "longer": "Expand and elaborate on the content."
        }
        
        prompt = f"""Rewrite the following text.
{level_instructions.get(level, level_instructions['medium'])}
{tone_instructions.get(tone, '')}
{length_instructions.get(length_change, length_instructions['same'])}
{"Add relevant emojis throughout." if use_emoji else ""}
{"Ensure the output is plagiarism-safe and original." if plagiarism_safe else ""}

Original text:
{text}

Rewritten text:"""
        
        return await self.generate(
            prompt=prompt,
            task_type=TaskType.REWRITING,
            stream=stream
        )
    
    # ==================== INSIGHTS ====================
    async def analyze_insights(
        self,
        text: str,
        analysis_profile: str = "general",
        extract_sentiment: bool = True,
        extract_emotions: bool = True,
        extract_key_points: bool = True,
        extract_entities: bool = True,
        extract_topics: bool = True,
        extract_intent: bool = True,
        actionable_insights: bool = True,
        images: Optional[List[bytes]] = None,
        stream: bool = False
    ) -> Union[str, Dict[str, Any], AsyncGenerator[str, None]]:
        """Extract comprehensive insights from text"""
        
        profiles = {
            "general": "Provide a general analysis.",
            "business": "Focus on business implications, opportunities, and risks.",
            "legal": "Focus on legal implications, compliance, and risks.",
            "academic": "Focus on research implications and scholarly significance.",
            "marketing": "Focus on marketing opportunities and audience insights.",
            "technical": "Focus on technical details and implementation considerations."
        }
        
        prompt = f"""Analyze the following content and provide insights.
Analysis Profile: {profiles.get(analysis_profile, profiles['general'])}

Content to analyze:
{text}

Provide a comprehensive JSON response with the following structure:
{{
    "summary": "Brief overview of the content",
"""
        
        if extract_sentiment:
            prompt += '    "sentiment": {"overall": "positive/negative/neutral", "score": 0.0-1.0, "details": "explanation"},\n'
        if extract_emotions:
            prompt += '    "emotions": ["list of detected emotions with intensity"],\n'
        if extract_key_points:
            prompt += '    "key_points": ["list of main points"],\n'
        if extract_entities:
            prompt += '    "entities": {"people": [], "organizations": [], "locations": [], "dates": [], "other": []},\n'
        if extract_topics:
            prompt += '    "topics": ["main topics/themes"],\n'
        if extract_intent:
            prompt += '    "intent": "detected purpose or intent of the content",\n'
        if actionable_insights:
            prompt += '    "actionable_insights": ["list of recommended actions"],\n'
        
        prompt += '    "confidence": 0.0-1.0\n}'
        
        return await self.generate(
            prompt=prompt,
            task_type=TaskType.INSIGHTS,
            images=images,
            stream=stream
        )
    
    # ==================== IMAGE ANALYSIS ====================
    async def analyze_image(
        self,
        image_data: bytes,
        prompt: str = "Describe this image in detail.",
        extract_text: bool = False,
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Analyze image using Vision model"""
        
        full_prompt = prompt
        if extract_text:
            full_prompt += "\n\nAlso extract and list any text visible in the image."
        
        return await self.generate(
            prompt=full_prompt,
            task_type=TaskType.IMAGE_ANALYSIS,
            images=[image_data],
            stream=stream
        )
    
    # ==================== IMAGE GENERATION PROMPTS ====================
    async def enhance_image_prompt(
        self,
        user_prompt: str = None,
        prompt: str = None,
        style: str = "realistic",
        enhance_quality: bool = True
    ) -> str:
        """Enhance user prompt for better image generation"""
        
        # Support both parameter names
        actual_prompt = user_prompt or prompt
        if not actual_prompt:
            return ""
        
        style_additions = {
            "realistic": "photorealistic, highly detailed, 8k resolution, professional photography",
            "anime": "anime style, vibrant colors, detailed linework, studio ghibli inspired",
            "cyberpunk": "cyberpunk aesthetic, neon lights, futuristic, dark atmosphere",
            "3d": "3D rendered, octane render, unreal engine, volumetric lighting",
            "watercolor": "watercolor painting, soft edges, artistic, traditional media",
            "oil_painting": "oil painting style, classical art, rich textures, masterpiece",
            "neon": "neon aesthetic, glowing, vibrant colors, dark background",
            "minimalist": "minimalist design, clean lines, simple, modern"
        }
        
        enhancement_prompt = f"""Enhance this image generation prompt to be more detailed and effective.
Original prompt: {actual_prompt}
Style: {style_additions.get(style, style_additions['realistic'])}
{"Add quality boosters like: highly detailed, professional, award-winning" if enhance_quality else ""}

Provide only the enhanced prompt, nothing else."""
        
        return await self.generate(
            prompt=enhancement_prompt,
            task_type=TaskType.CHAT_SIMPLE,
            temperature=0.8
        )
    
    # ==================== IMAGE GENERATION ====================
    
    # Cache for available models
    _available_models_cache: List[str] = []
    _models_cache_time: float = 0
    
    async def _get_available_image_models(self) -> List[str]:
        """
        Dynamically detect available image generation models.
        Caches results for 5 minutes.
        """
        import time
        
        # Return cached if less than 5 minutes old
        if self._available_models_cache and (time.time() - self._models_cache_time) < 300:
            return self._available_models_cache
        
        image_models = []
        
        try:
            # List all available models
            models = await asyncio.to_thread(genai.list_models)
            
            for model in models:
                model_name = model.name.replace("models/", "")
                supported_methods = getattr(model, 'supported_generation_methods', [])
                
                # Check for image generation capability
                if any(method in str(supported_methods).lower() for method in ['generatecontent', 'predict']):
                    # Prioritize imagen models
                    if 'imagen' in model_name.lower():
                        image_models.insert(0, model_name)
                    # Add gemini models that might support image output
                    elif 'gemini' in model_name.lower() and ('flash' in model_name.lower() or 'pro' in model_name.lower()):
                        image_models.append(model_name)
            
            logger.info(f"Detected image-capable models: {image_models[:10]}")
            
        except Exception as e:
            logger.error(f"Error listing models: {e}")
        
        # Fallback model list if detection fails
        if not image_models:
            image_models = [
                "gemini-2.0-flash-exp",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
            ]
        
        self._available_models_cache = image_models
        self._models_cache_time = time.time()
        
        return image_models
    
    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic",
        width: int = 1024,
        height: int = 1024,
        enhance_prompt: bool = True,
        negative_prompt: str = ""
    ) -> Dict[str, Any]:
        """
        Generate image using available Gemini/Imagen models.
        Auto-detects available models and uses correct API methods.
        Returns base64 encoded image data or enhanced prompt as fallback.
        """
        try:
            # First enhance the prompt if requested
            final_prompt = prompt
            if enhance_prompt:
                final_prompt = await self.enhance_image_prompt(
                    user_prompt=prompt,
                    style=style,
                    enhance_quality=True
                )
            
            logger.info(f"Generating image with prompt: {final_prompt[:100]}...")
            
            # Try Gemini 2.0 Flash image generation first (most reliable)
            gemini_result = await self._try_gemini_image_generation(final_prompt, width, height)
            if gemini_result.get("success"):
                gemini_result["original_prompt"] = prompt
                gemini_result["style"] = style
                return gemini_result
            
            # Fallback to Imagen models (may not be available for all API keys)
            imagen_result = await self._try_imagen_generation(final_prompt, width, height)
            if imagen_result.get("success"):
                imagen_result["original_prompt"] = prompt
                imagen_result["style"] = style
                return imagen_result
            
            # All methods failed - return enhanced prompt for external use
            logger.warning("All image generation methods failed, returning enhanced prompt")
            return {
                "success": False,
                "error": "Image generation models are not available with your API key. Use the enhanced prompt with an external image generator (DALL-E, Midjourney, Stable Diffusion).",
                "enhanced_prompt": final_prompt,
                "original_prompt": prompt,
                "style": style,
                "fallback": True,
                "dimensions": {"width": width, "height": height}
            }
                    
        except Exception as e:
            logger.error(f"Image generation error: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Image generation failed: {str(e)}",
                "original_prompt": prompt,
                "style": style
            }
    
    async def _try_imagen_generation(self, prompt: str, width: int, height: int) -> Dict[str, Any]:
        """Try generating image using google-genai Imagen API."""
        try:
            from google import genai as google_genai
            from google.genai import types
            
            client = google_genai.Client(api_key=GEMINI_API_KEY)
            
            # Determine aspect ratio
            if width == height:
                aspect_ratio = "1:1"
            elif width > height:
                aspect_ratio = "16:9"
            else:
                aspect_ratio = "9:16"
            
            # List of Imagen models to try in order
            imagen_models = [
                "imagen-3.0-generate-001",
                "imagen-3.0-fast-generate-001", 
                "imagegeneration@006",
                "imagegeneration@005",
                "imagegeneration@002",
            ]
            
            for model_id in imagen_models:
                try:
                    logger.info(f"Trying Imagen model: {model_id}")
                    
                    response = await asyncio.to_thread(
                        client.models.generate_images,
                        model=model_id,
                        prompt=prompt,
                        config=types.GenerateImagesConfig(
                            number_of_images=1,
                            aspect_ratio=aspect_ratio,
                            safety_filter_level="block_only_high",
                        )
                    )
                    
                    if response and hasattr(response, 'generated_images') and response.generated_images:
                        image = response.generated_images[0]
                        if hasattr(image, 'image') and hasattr(image.image, 'image_bytes'):
                            image_bytes = image.image.image_bytes
                            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                            
                            logger.info(f"Successfully generated image with {model_id}")
                            return {
                                "success": True,
                                "image": image_base64,
                                "mime_type": "image/png",
                                "prompt_used": prompt,
                                "model_used": model_id,
                                "dimensions": {"width": width, "height": height}
                            }
                            
                except Exception as model_error:
                    error_str = str(model_error).lower()
                    # Skip to next model on 404/not found errors
                    if '404' in error_str or 'not found' in error_str or 'not_found' in error_str:
                        logger.warning(f"Model {model_id} not available: {model_error}")
                        continue
                    # For other errors, log and continue
                    logger.warning(f"Model {model_id} failed: {model_error}")
                    continue
            
            return {"success": False, "error": "No Imagen models available"}
            
        except ImportError:
            logger.warning("google-genai library not available")
            return {"success": False, "error": "google-genai library not installed"}
        except Exception as e:
            logger.error(f"Imagen generation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _try_gemini_image_generation(self, prompt: str, width: int, height: int) -> Dict[str, Any]:
        """
        Try generating image using Gemini 2.0 Flash image generation model.
        Uses google-genai client with response_modalities for proper image output.
        """
        try:
            from google import genai as google_genai
            from google.genai import types as genai_types
            
            client = google_genai.Client(api_key=GEMINI_API_KEY)
            
            # Models that support image generation with response_modalities
            image_gen_models = [
                "gemini-2.0-flash-exp-image-generation",
                "gemini-2.0-flash-exp",
            ]
            
            for model_name in image_gen_models:
                try:
                    logger.info(f"Trying Gemini image model: {model_name}")
                    
                    # Use google-genai client with response_modalities for image output
                    response = await asyncio.to_thread(
                        client.models.generate_content,
                        model=model_name,
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            response_modalities=["IMAGE", "TEXT"],
                            temperature=1.0,
                        )
                    )
                    
                    # Extract image from response
                    if hasattr(response, 'candidates') and response.candidates:
                        for candidate in response.candidates:
                            if hasattr(candidate, 'content') and candidate.content:
                                for part in candidate.content.parts:
                                    # Check for inline image data
                                    if hasattr(part, 'inline_data') and part.inline_data:
                                        inline = part.inline_data
                                        mime_type = getattr(inline, 'mime_type', '')
                                        
                                        if 'image' in mime_type:
                                            raw_data = getattr(inline, 'data', None)
                                            if raw_data:
                                                # Encode to base64
                                                if isinstance(raw_data, bytes):
                                                    image_base64 = base64.b64encode(raw_data).decode('utf-8')
                                                else:
                                                    image_base64 = str(raw_data)
                                                
                                                logger.info(f"Successfully generated image with {model_name}")
                                                return {
                                                    "success": True,
                                                    "image": image_base64,
                                                    "mime_type": mime_type,
                                                    "prompt_used": prompt,
                                                    "model_used": model_name,
                                                    "dimensions": {"width": width, "height": height}
                                                }
                    
                    logger.info(f"Model {model_name} did not return image data")
                    continue
                    
                except Exception as e:
                    error_str = str(e).lower()
                    logger.warning(f"Gemini model {model_name} error: {e}")
                    if '404' in error_str or 'not found' in error_str:
                        continue
                    if '400' in error_str or 'invalid' in error_str:
                        continue
                    continue
            
            return {"success": False, "error": "Gemini image generation models did not return images"}
            
        except ImportError:
            logger.warning("google-genai library not available for Gemini image generation")
            return {"success": False, "error": "google-genai library required for image generation"}
        except Exception as e:
            logger.error(f"Gemini image generation failed: {e}")
            return {"success": False, "error": str(e)}


# Singleton instance
gemini_service = GeminiService()
