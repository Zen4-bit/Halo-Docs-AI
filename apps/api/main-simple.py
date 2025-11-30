"""
HALO Docs AI - Simplified Backend for Local Development
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="HALO Docs AI - Local Backend",
    description="Simplified backend for local development",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://host.docker.internal:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Local backend is running"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "HALO Docs AI - Local Backend", "status": "running"}

# API info endpoint
@app.get("/api/v1")
async def api_info():
    return {"message": "HALO Docs AI API v1", "endpoints": ["/health", "/api/v1"]}

# Simple AI endpoint (mock for testing)
@app.post("/api/v1/chat")
async def chat_endpoint(request: dict):
    user_message = request.get("message", "")
    return {"response": f"Local backend received: {user_message}"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8080))
    print(f"🚀 Starting HALO Docs AI Local Backend on port {port}")
    print(f"📊 Health check: http://localhost:{port}/health")
    print(f"📚 API docs: http://localhost:{port}/docs")
    uvicorn.run(
        "main-simple:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
