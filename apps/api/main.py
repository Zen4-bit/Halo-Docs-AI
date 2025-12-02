"""
HALO Docs AI - FastAPI Backend
Production-ready API with all tool endpoints
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routers
from routers.tools import tools_router
# Note: ai_router removed - ai_workspace provides complete AI functionality with Form data support
from routers.ai_workspace import router as ai_workspace_router

# Create FastAPI app
app = FastAPI(
    title="HALO Docs AI API",
    description="Professional-grade tools for PDF, Office documents, images, and AI processing",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local and Cloud Run deployments
cors_origins_env = os.getenv("CORS_ORIGINS", "")

# Parse CORS origins - support wildcard for Cloud Run
if cors_origins_env == "*":
    cors_origins = ["*"]
elif cors_origins_env:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    # Default origins for development
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://host.docker.internal:3000",
    ]

# Add Cloud Run domain pattern
cors_origins.extend([
    "https://*.run.app",
    "https://*.a.run.app",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],
    allow_origin_regex=r"https://.*\.run\.app" if "*" not in cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Original-Size", "X-Compressed-Size", "X-Compression-Ratio"]
)

# Add gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(tools_router)  # PDF, Office, Media tools at /api/tools
app.include_router(ai_workspace_router)  # AI Workspace tools at /api/ai

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "services": {
            "pdf_tools": "operational",
            "office_tools": "operational",
            "media_tools": "operational",
            "ai_tools": "operational"
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """API information"""
    return {
        "name": "HALO Docs AI API",
        "version": "2.0.0",
        "description": "Professional-grade document and AI tools",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "tools": "/api/tools",
            "ai": "/api/ai",
            "pdf": "/api/tools/merge-pdf, /api/tools/split-pdf, etc.",
            "office": "/api/tools/word-to-pdf, /api/tools/excel-to-pdf, etc.",
            "media": "/api/tools/image-compressor, /api/tools/resize-*, etc."
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8080))
    
    print("=" * 60)
    print("🚀 HALO Docs AI Backend v2.0.0")
    print("=" * 60)
    print(f"📊 Port: {port}")
    print(f"🔗 Health: http://localhost:{port}/health")
    print(f"📚 Docs: http://localhost:{port}/docs")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
