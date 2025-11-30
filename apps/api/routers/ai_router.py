"""
AI Tools Router
Complete AI endpoints for chat, summarization, translation, rewriting, and insights
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import logging
import base64

# Import AI client
from services.vertex_ai_client import vertex_client

logger = logging.getLogger(__name__)

ai_router = APIRouter(prefix="/api/ai", tags=["AI Tools"])


# ============== Pydantic Models ==============

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048

class SummarizeRequest(BaseModel):
    text: str
    summary_type: Optional[str] = "concise"  # concise, detailed, bullet_points
    max_length: Optional[int] = 500

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = "auto"

class RewriteRequest(BaseModel):
    text: str
    style: Optional[str] = "professional"  # professional, casual, academic, creative, concise
    tone: Optional[str] = "neutral"  # neutral, formal, friendly, persuasive

class InsightsRequest(BaseModel):
    text: str
    analysis_type: Optional[str] = "general"  # general, sentiment, key_points, action_items

class ImageGenerateRequest(BaseModel):
    prompt: str
    aspect_ratio: Optional[str] = "1:1"
    style: Optional[str] = "photographic"
    quantity: Optional[int] = 1


# ============== Chat Endpoint ==============

@ai_router.post("/chat")
async def ai_chat(request: ChatRequest):
    """
    AI Chat - Conversational AI assistant
    
    Send a message and get an intelligent response.
    Supports conversation history for context.
    """
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Build context from history
        context = ""
        if request.history:
            for msg in request.history[-10:]:  # Last 10 messages for context
                role = msg.get("role", "user")
                content = msg.get("content", "")
                context += f"{role.upper()}: {content}\n"
        
        # Create prompt with context
        if context:
            prompt = f"""Previous conversation:
{context}

USER: {request.message}

Provide a helpful, accurate, and conversational response:"""
        else:
            prompt = request.message
        
        response = await vertex_client.generate_text(
            prompt=prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return {"response": response, "status": "success"}
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Summarize Endpoint ==============

@ai_router.post("/summarize")
async def ai_summarize(request: SummarizeRequest):
    """
    AI Document Summary - Extract key points from text
    
    Summarization types:
    - concise: Brief overview
    - detailed: Comprehensive summary
    - bullet_points: Key points as bullets
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if len(request.text) < 50:
            raise HTTPException(status_code=400, detail="Text too short to summarize (min 50 characters)")
        
        style_prompts = {
            "concise": "Provide a brief, concise summary in 2-3 sentences:",
            "detailed": "Provide a comprehensive summary covering all main points:",
            "bullet_points": "Summarize the key points as a bullet-point list:"
        }
        
        style_instruction = style_prompts.get(request.summary_type, style_prompts["concise"])
        
        prompt = f"""TEXT TO SUMMARIZE:
{request.text}

{style_instruction}"""
        
        summary = await vertex_client.generate_text(prompt, temperature=0.3)
        
        return {
            "summary": summary,
            "original_length": len(request.text),
            "summary_length": len(summary),
            "compression_ratio": round(len(summary) / len(request.text) * 100, 1),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summarize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Translate Endpoint ==============

@ai_router.post("/translate")
async def ai_translate(request: TranslateRequest):
    """
    AI Translator - Translate text between languages
    
    Supports 100+ languages including:
    - English, Spanish, French, German, Italian, Portuguese
    - Chinese, Japanese, Korean, Arabic, Hindi
    - Russian, Dutch, Polish, Swedish, and more
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if not request.target_language.strip():
            raise HTTPException(status_code=400, detail="Target language is required")
        
        prompt = f"""Translate the following text to {request.target_language}.
Maintain the original meaning, tone, and formatting.
Only provide the translation, no explanations.

TEXT TO TRANSLATE:
{request.text}

TRANSLATION:"""
        
        translation = await vertex_client.generate_text(prompt, temperature=0.2)
        
        return {
            "translated_text": translation,
            "source_language": request.source_language,
            "target_language": request.target_language,
            "original_text": request.text,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Rewrite Endpoint ==============

@ai_router.post("/rewrite")
async def ai_rewrite(request: RewriteRequest):
    """
    AI Rewriter - Improve and rephrase text
    
    Styles:
    - professional: Business-appropriate language
    - casual: Friendly, conversational tone
    - academic: Scholarly, formal writing
    - creative: Engaging, expressive language
    - concise: Shorter, more direct version
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        style_instructions = {
            "professional": "Rewrite in a professional, business-appropriate style",
            "casual": "Rewrite in a friendly, conversational tone",
            "academic": "Rewrite in a scholarly, academic style with formal language",
            "creative": "Rewrite in an engaging, creative, and expressive way",
            "concise": "Rewrite to be more concise and direct while keeping the meaning"
        }
        
        tone_instructions = {
            "neutral": "Keep the tone neutral and objective",
            "formal": "Use formal language and structure",
            "friendly": "Make it warm and approachable",
            "persuasive": "Make it compelling and persuasive"
        }
        
        style = style_instructions.get(request.style, style_instructions["professional"])
        tone = tone_instructions.get(request.tone, tone_instructions["neutral"])
        
        prompt = f"""{style}. {tone}.

ORIGINAL TEXT:
{request.text}

REWRITTEN VERSION:"""
        
        rewritten = await vertex_client.generate_text(prompt, temperature=0.5)
        
        return {
            "rewritten_text": rewritten,
            "original_text": request.text,
            "style": request.style,
            "tone": request.tone,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rewrite error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Insights Endpoint ==============

@ai_router.post("/insights")
async def ai_insights(request: InsightsRequest):
    """
    AI Insights - Get intelligent analysis and recommendations
    
    Analysis types:
    - general: Overall analysis and observations
    - sentiment: Emotional tone and sentiment analysis
    - key_points: Extract main ideas and themes
    - action_items: Identify actionable tasks and recommendations
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        analysis_prompts = {
            "general": """Analyze this text and provide:
1. Main topic and purpose
2. Key observations
3. Strengths and areas for improvement
4. Recommendations""",
            
            "sentiment": """Analyze the sentiment and emotional tone of this text:
1. Overall sentiment (positive/negative/neutral)
2. Emotional indicators
3. Tone analysis
4. Confidence level""",
            
            "key_points": """Extract and organize the key points from this text:
1. Main ideas
2. Supporting details
3. Conclusions
4. Important quotes or data""",
            
            "action_items": """Identify actionable items from this text:
1. Tasks to complete
2. Decisions to make
3. Follow-ups needed
4. Deadlines or priorities"""
        }
        
        analysis_instruction = analysis_prompts.get(
            request.analysis_type, 
            analysis_prompts["general"]
        )
        
        prompt = f"""TEXT TO ANALYZE:
{request.text}

{analysis_instruction}

Provide a structured analysis:"""
        
        insights = await vertex_client.generate_text(prompt, temperature=0.4)
        
        return {
            "insights": insights,
            "analysis_type": request.analysis_type,
            "text_length": len(request.text),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Image Generation Endpoint ==============

@ai_router.post("/generate-image")
async def ai_generate_image(request: ImageGenerateRequest):
    """
    AI Image Studio - Generate images from text descriptions
    
    Features:
    - Text-to-image generation
    - Multiple aspect ratios (1:1, 16:9, 4:3, etc.)
    - Various styles (photographic, artistic, etc.)
    """
    try:
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        result = await vertex_client.generate_image(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            style=request.style,
            number_of_images=min(request.quantity, 4)
        )
        
        if "error" in result:
            return JSONResponse(
                status_code=500,
                content={"error": result["error"], "status": "error"}
            )
        
        return {
            "images": result.get("images", []),
            "prompt": request.prompt,
            "style": request.style,
            "aspect_ratio": request.aspect_ratio,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Image Analysis Endpoint ==============

@ai_router.post("/analyze-image")
async def ai_analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    question: str = Form("What do you see in this image?", description="Question about the image")
):
    """
    AI Image Analysis - Get insights from images
    
    Upload an image and ask questions about it.
    Supports: JPG, PNG, WebP, GIF
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Read and encode image
        content = await file.read()
        if len(content) > 20 * 1024 * 1024:  # 20MB limit
            raise HTTPException(status_code=400, detail="Image too large (max 20MB)")
        
        image_base64 = base64.b64encode(content).decode('utf-8')
        
        # Analyze with Vertex AI
        analysis = await vertex_client.analyze_image(image_base64, question)
        
        return {
            "analysis": analysis,
            "question": question,
            "filename": file.filename,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Document Processing Endpoint ==============

@ai_router.post("/process-document")
async def ai_process_document(
    file: UploadFile = File(..., description="Document file to process"),
    action: str = Form("summarize", description="Action: summarize, extract, analyze")
):
    """
    AI Document Processing - Process uploaded documents
    
    Actions:
    - summarize: Generate a summary
    - extract: Extract key information
    - analyze: Full analysis
    
    Supports: TXT, PDF (text content), DOCX (coming soon)
    """
    try:
        # Read file content
        content = await file.read()
        
        # Try to decode as text
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = content.decode('latin-1')
            except:
                raise HTTPException(
                    status_code=400, 
                    detail="Could not read file. Please upload a text-based document."
                )
        
        if len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Document too short to process")
        
        # Process based on action
        if action == "summarize":
            prompt = f"Summarize this document:\n\n{text[:10000]}"
        elif action == "extract":
            prompt = f"Extract key information (names, dates, numbers, important facts) from this document:\n\n{text[:10000]}"
        elif action == "analyze":
            prompt = f"Provide a comprehensive analysis of this document including main themes, key points, and recommendations:\n\n{text[:10000]}"
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use: summarize, extract, analyze")
        
        result = await vertex_client.generate_text(prompt, temperature=0.3)
        
        return {
            "result": result,
            "action": action,
            "filename": file.filename,
            "document_length": len(text),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Health Check ==============

@ai_router.get("/health")
async def ai_health():
    """AI tools health check"""
    return {
        "status": "healthy",
        "tools": [
            "chat",
            "summarize", 
            "translate",
            "rewrite",
            "insights",
            "generate-image",
            "analyze-image",
            "process-document"
        ],
        "message": "All AI tools operational"
    }
