"""
AI Workspace Router
Handles all 6 AI tools: Chat, Summary, Image Studio, Translator, Rewriter, Insights
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Optional, List
import json
import io
import base64
import logging
from pathlib import Path

from services.gemini_service import gemini_service, TaskType

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import optional utilities
try:
    from utils.file_validator import FileValidator
except ImportError:
    FileValidator = None

try:
    from utils.temp_manager import temp_manager
except ImportError:
    temp_manager = None

router = APIRouter(prefix="/api/ai", tags=["AI Workspace"])


# ==================== UTILITIES ====================
async def read_file_content(file: UploadFile) -> tuple[str, Optional[bytes]]:
    """Read file content - text for documents, bytes for images"""
    content = await file.read()
    filename = file.filename.lower()
    
    if filename.endswith(('.txt', '.md')):
        return content.decode('utf-8'), None
    
    elif filename.endswith('.pdf'):
        try:
            import pypdf
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text, None
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
    
    elif filename.endswith(('.doc', '.docx')):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
            return text, None
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read DOCX: {str(e)}")
    
    elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
        return "", content
    
    else:
        try:
            return content.decode('utf-8'), None
        except:
            raise HTTPException(status_code=400, detail="Unsupported file type")


# ==================== AI CHAT ====================
@router.post("/chat")
async def ai_chat(
    message: str = Form(...),
    history: str = Form("[]"),
    personality: str = Form("helpful"),
    temperature: float = Form(0.7),
    stream: bool = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    AI Chat with dynamic model selection
    - Supports text, images, PDFs, and documents
    - Multiple personality presets
    - Streaming responses
    - Chat history support
    """
    try:
        chat_history = json.loads(history)
    except:
        chat_history = []
    
    images = None
    file_context = ""
    
    if file:
        text_content, image_data = await read_file_content(file)
        if image_data:
            images = [image_data]
        if text_content:
            file_context = f"\n\n[Attached Document Content]:\n{text_content[:50000]}"
    
    full_message = message + file_context
    
    try:
        logger.info(f"AI Chat request - message length: {len(full_message)}, stream: {stream}")
        
        if stream:
            async def generate():
                try:
                    response_gen = await gemini_service.chat(
                        message=full_message,
                        history=chat_history,
                        personality=personality,
                        temperature=temperature,
                        images=images,
                        stream=True
                    )
                    async for chunk in response_gen:
                        yield f"data: {json.dumps({'text': chunk})}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            response = await gemini_service.chat(
                message=full_message,
                history=chat_history,
                personality=personality,
                temperature=temperature,
                images=images,
                stream=False
            )
            logger.info(f"AI Chat response generated - length: {len(str(response)) if response else 0}")
            return {"response": response, "model": "auto-selected"}
    
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI DOCUMENT SUMMARY ====================
@router.post("/summarize")
async def ai_summarize(
    text: str = Form(None),
    level: str = Form("medium"),
    style: str = Form("paragraph"),
    language: str = Form("English"),
    extract_topics: bool = Form(False),
    extract_sentiment: bool = Form(False),
    extract_entities: bool = Form(False),
    stream: bool = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    AI Document Summary
    - Auto-detect file type
    - Multiple summary levels
    - Topic, sentiment, entity extraction
    - Multilingual support
    """
    content_text = text or ""
    image_data = None
    
    if file:
        file_text, img = await read_file_content(file)
        if img:
            image_data = img
        content_text = file_text or content_text
    
    if not content_text and not image_data:
        raise HTTPException(status_code=400, detail="No content provided")
    
    try:
        logger.info(f"AI Summarize request - text length: {len(content_text)}, has_image: {image_data is not None}")
        
        # For images, use vision analysis
        if image_data:
            prompt = f"""Analyze this image and provide a summary.
Level: {level}
Style: {style}
Language: {language}
{"Include main topics." if extract_topics else ""}
{"Include sentiment analysis." if extract_sentiment else ""}
{"Include key entities." if extract_entities else ""}"""
            
            response = await gemini_service.analyze_image(
                image_data=image_data,
                prompt=prompt,
                stream=stream
            )
        else:
            response = await gemini_service.summarize(
                text=content_text,
                level=level,
                style=style,
                language=language,
                extract_topics=extract_topics,
                extract_sentiment=extract_sentiment,
                extract_entities=extract_entities,
                stream=stream
            )
        
        if stream:
            async def generate():
                try:
                    async for chunk in response:
                        yield f"data: {json.dumps({'text': chunk})}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    logger.error(f"Summarize streaming error: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return StreamingResponse(generate(), media_type="text/event-stream")
        
        logger.info(f"AI Summarize response generated")
        return {"summary": response, "model": "auto-selected"}
    
    except Exception as e:
        logger.error(f"AI Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI IMAGE STUDIO ====================
@router.post("/image-studio/analyze")
async def ai_image_analyze(
    prompt: str = Form("Describe this image in detail"),
    extract_text: bool = Form(False),
    file: UploadFile = File(...)
):
    """Analyze image using Vision model"""
    try:
        content = await file.read()
        
        response = await gemini_service.analyze_image(
            image_data=content,
            prompt=prompt,
            extract_text=extract_text
        )
        
        return {"analysis": response, "model": "gemini-vision"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-studio/enhance-prompt")
async def ai_enhance_prompt(
    prompt: str = Form(...),
    style: str = Form("realistic")
):
    """Enhance image generation prompt"""
    try:
        enhanced = await gemini_service.enhance_image_prompt(
            user_prompt=prompt,
            style=style
        )
        return {"original": prompt, "enhanced": enhanced, "style": style}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-studio/generate")
async def ai_generate_image(
    prompt: str = Form(...),
    style: str = Form("realistic"),
    enhance_prompt: bool = Form(True),
    width: int = Form(1024),
    height: int = Form(1024),
    negative_prompt: str = Form("")
):
    """
    Generate image from text prompt using Gemini/Imagen
    Returns base64 encoded image or enhanced prompt as fallback
    """
    try:
        logger.info(f"Image generation request - prompt: {prompt[:50]}..., style: {style}")
        
        result = await gemini_service.generate_image(
            prompt=prompt,
            style=style,
            width=width,
            height=height,
            enhance_prompt=enhance_prompt,
            negative_prompt=negative_prompt
        )
        
        if result.get("success"):
            return {
                "success": True,
                "image": result["image"],
                "mime_type": result.get("mime_type", "image/png"),
                "prompt_used": result.get("prompt_used", prompt),
                "original_prompt": prompt,
                "style": style,
                "dimensions": {"width": width, "height": height}
            }
        else:
            # Return fallback with enhanced prompt
            return {
                "success": False,
                "error": result.get("error", "Image generation failed"),
                "enhanced_prompt": result.get("enhanced_prompt", prompt),
                "original_prompt": prompt,
                "style": style,
                "dimensions": {"width": width, "height": height},
                "fallback": True
            }
    
    except Exception as e:
        logger.error(f"Image generation endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-studio/variations")
async def ai_image_variations(
    prompt: str = Form("Generate a variation of this image"),
    file: UploadFile = File(...)
):
    """Generate image variation description"""
    try:
        content = await file.read()
        
        analysis = await gemini_service.analyze_image(
            image_data=content,
            prompt="Describe this image in detail for recreation. Include: composition, colors, style, subjects, mood, lighting."
        )
        
        variation_prompt = await gemini_service.enhance_image_prompt(
            user_prompt=f"Create a variation of: {analysis}. {prompt}",
            style="realistic"
        )
        
        return {
            "original_description": analysis,
            "variation_prompt": variation_prompt
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI TRANSLATOR ====================
@router.post("/translate")
async def ai_translate(
    text: str = Form(None),
    target_language: str = Form(...),
    source_language: str = Form("auto"),
    tone: str = Form("neutral"),
    preserve_formatting: bool = Form(True),
    sentence_by_sentence: bool = Form(False),
    stream: bool = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    AI Translator
    - 100+ languages
    - Tone control
    - Document translation
    - Image translation with Vision
    """
    content_text = text or ""
    image_data = None
    
    if file:
        file_text, img = await read_file_content(file)
        if img:
            image_data = img
        content_text = file_text or content_text
    
    if not content_text and not image_data:
        raise HTTPException(status_code=400, detail="No content provided")
    
    try:
        if image_data:
            # Translate text in image
            prompt = f"""Extract all text from this image and translate it to {target_language}.
Tone: {tone}
{"Preserve the original layout and formatting." if preserve_formatting else ""}

Format your response as:
[Original Text]: ...
[Translation]: ..."""
            
            response = await gemini_service.analyze_image(
                image_data=image_data,
                prompt=prompt,
                extract_text=True
            )
        else:
            response = await gemini_service.translate(
                text=content_text,
                target_language=target_language,
                source_language=source_language,
                tone=tone,
                preserve_formatting=preserve_formatting,
                sentence_by_sentence=sentence_by_sentence,
                stream=stream
            )
        
        if stream and not image_data:
            async def generate():
                async for chunk in response:
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(generate(), media_type="text/event-stream")
        
        return {
            "translation": response,
            "source_language": source_language,
            "target_language": target_language,
            "tone": tone,
            "model": "auto-selected"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI REWRITER ====================
@router.post("/rewrite")
async def ai_rewrite(
    text: str = Form(None),
    level: str = Form("medium"),
    tone: str = Form("neutral"),
    length_change: str = Form("same"),
    use_emoji: bool = Form(False),
    plagiarism_safe: bool = Form(False),
    stream: bool = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    AI Rewriter
    - Multiple rewrite levels
    - Tone styles
    - Length control
    - Plagiarism-safe mode
    """
    content_text = text or ""
    
    if file:
        file_text, _ = await read_file_content(file)
        content_text = file_text or content_text
    
    if not content_text:
        raise HTTPException(status_code=400, detail="No content provided")
    
    try:
        response = await gemini_service.rewrite(
            text=content_text,
            level=level,
            tone=tone,
            length_change=length_change,
            use_emoji=use_emoji,
            plagiarism_safe=plagiarism_safe,
            stream=stream
        )
        
        if stream:
            async def generate():
                async for chunk in response:
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(generate(), media_type="text/event-stream")
        
        return {
            "rewritten": response,
            "level": level,
            "tone": tone,
            "model": "auto-selected"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI INSIGHTS ====================
@router.post("/insights")
async def ai_insights(
    text: str = Form(None),
    analysis_profile: str = Form("general"),
    extract_sentiment: bool = Form(True),
    extract_emotions: bool = Form(True),
    extract_key_points: bool = Form(True),
    extract_entities: bool = Form(True),
    extract_topics: bool = Form(True),
    extract_intent: bool = Form(True),
    actionable_insights: bool = Form(True),
    stream: bool = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    AI Insights
    - Comprehensive content analysis
    - Multiple analysis profiles
    - Entity extraction
    - Sentiment & emotion detection
    - Actionable insights
    """
    content_text = text or ""
    image_data = None
    
    if file:
        file_text, img = await read_file_content(file)
        if img:
            image_data = img
        content_text = file_text or content_text
    
    if not content_text and not image_data:
        raise HTTPException(status_code=400, detail="No content provided")
    
    try:
        images = [image_data] if image_data else None
        
        response = await gemini_service.analyze_insights(
            text=content_text if content_text else "Analyze the attached image.",
            analysis_profile=analysis_profile,
            extract_sentiment=extract_sentiment,
            extract_emotions=extract_emotions,
            extract_key_points=extract_key_points,
            extract_entities=extract_entities,
            extract_topics=extract_topics,
            extract_intent=extract_intent,
            actionable_insights=actionable_insights,
            images=images,
            stream=stream
        )
        
        if stream:
            async def generate():
                async for chunk in response:
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(generate(), media_type="text/event-stream")
        
        # Try to parse as JSON
        try:
            insights = json.loads(response)
        except:
            insights = {"raw_analysis": response}
        
        return {
            "insights": insights,
            "profile": analysis_profile,
            "model": "auto-selected"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== IMAGE STUDIO ====================
@router.post("/image-studio/analyze")
async def image_studio_analyze(
    prompt: str = Form("Describe this image in detail including composition, colors, style, subjects, mood, and lighting."),
    file: UploadFile = File(...)
):
    """
    Image Studio - Analyze image with Gemini Vision
    """
    if not file:
        raise HTTPException(status_code=400, detail="No image provided")
    
    content = await file.read()
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        response = await gemini_service.generate(
            prompt=prompt,
            task_type=TaskType.IMAGE_ANALYSIS,
            images=[content],
            temperature=0.5
        )
        
        return {
            "analysis": response,
            "model": "gemini-vision"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-studio/enhance-prompt")
async def image_studio_enhance_prompt(
    prompt: str = Form(...),
    style: str = Form("realistic")
):
    """
    Image Studio - Enhance image generation prompt
    """
    if not prompt:
        raise HTTPException(status_code=400, detail="No prompt provided")
    
    try:
        response = await gemini_service.enhance_image_prompt(
            prompt=prompt,
            style=style
        )
        
        return {
            "enhanced": response,
            "original": prompt,
            "style": style
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-studio/variations")
async def image_studio_variations(
    prompt: str = Form(""),
    file: UploadFile = File(...)
):
    """
    Image Studio - Generate variation prompt from image
    """
    if not file:
        raise HTTPException(status_code=400, detail="No image provided")
    
    content = await file.read()
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # First analyze the image
        analysis_prompt = "Describe this image in detail for recreating it: subjects, composition, colors, lighting, style, mood, and background."
        
        analysis = await gemini_service.generate(
            prompt=analysis_prompt,
            task_type=TaskType.IMAGE_ANALYSIS,
            images=[content],
            temperature=0.3
        )
        
        # Then enhance it for variations
        variation_prompt = f"Based on this image description, create a detailed prompt for generating a creative variation:\n\n{analysis}\n\nAdditional request: {prompt if prompt else 'Create an interesting variation'}"
        
        enhanced = await gemini_service.generate(
            prompt=variation_prompt,
            task_type=TaskType.CREATIVE,
            temperature=0.8
        )
        
        return {
            "variation_prompt": enhanced,
            "original_analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HEALTH CHECK ====================
@router.get("/health")
async def health_check():
    """Check AI service health"""
    return {
        "status": "healthy",
        "services": {
            "chat": "operational",
            "summarize": "operational",
            "image_studio": "operational",
            "translate": "operational",
            "rewrite": "operational",
            "insights": "operational"
        },
        "model_selection": "dynamic",
        "streaming": "supported"
    }


@router.get("/models")
async def list_available_models():
    """List all available AI models for debugging"""
    import google.generativeai as genai
    
    try:
        models = list(genai.list_models())
        model_list = []
        image_capable = []
        
        for model in models:
            model_name = model.name.replace("models/", "")
            methods = getattr(model, 'supported_generation_methods', [])
            
            model_info = {
                "name": model_name,
                "display_name": getattr(model, 'display_name', model_name),
                "methods": list(methods) if methods else [],
            }
            model_list.append(model_info)
            
            # Check if it might support images
            if 'imagen' in model_name.lower() or 'image' in model_name.lower():
                image_capable.append(model_name)
        
        return {
            "total_models": len(model_list),
            "models": model_list,
            "image_capable": image_capable
        }
    except Exception as e:
        return {"error": str(e)}


# ==================== SUPPORTED LANGUAGES ====================
@router.get("/languages")
async def get_languages():
    """Get list of supported languages"""
    return {
        "languages": [
            "English", "Spanish", "French", "German", "Italian", "Portuguese",
            "Russian", "Chinese (Simplified)", "Chinese (Traditional)", "Japanese",
            "Korean", "Arabic", "Hindi", "Bengali", "Urdu", "Turkish", "Vietnamese",
            "Thai", "Indonesian", "Malay", "Filipino", "Dutch", "Polish", "Ukrainian",
            "Czech", "Romanian", "Hungarian", "Greek", "Swedish", "Norwegian",
            "Danish", "Finnish", "Hebrew", "Persian", "Swahili", "Zulu", "Afrikaans",
            "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Gujarati", "Punjabi",
            "Nepali", "Sinhala", "Burmese", "Khmer", "Lao", "Mongolian", "Kazakh",
            "Uzbek", "Georgian", "Armenian", "Azerbaijani", "Albanian", "Serbian",
            "Croatian", "Bosnian", "Slovenian", "Slovak", "Bulgarian", "Macedonian",
            "Lithuanian", "Latvian", "Estonian", "Icelandic", "Irish", "Welsh",
            "Basque", "Catalan", "Galician", "Maltese", "Latin", "Esperanto"
        ]
    }
