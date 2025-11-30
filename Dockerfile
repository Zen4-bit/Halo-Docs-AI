# HALO Docs AI - Unified Backend & Worker Dockerfile
# Builds a single Python image used by both FastAPI backend and Celery worker

FROM python:3.12-slim

# --- Base environment configuration ---
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# --- System dependencies (for psycopg2, healthchecks, etc.) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# --- Python dependencies (cached via requirements.txt) ---
# Build context is project root (.) so requirements live at apps/api/requirements.txt
COPY apps/api/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /tmp/requirements.txt \
    && rm -rf /root/.cache/pip

# --- Application source code ---
# Copy backend API code into the image (excluding local venv, logs, etc.)
COPY apps/api/ .

# --- Application directories ---
RUN mkdir -p /app/uploads

# --- Environment variable placeholders (overridden by docker-compose) ---
ENV API_PORT=8080 \
    PYTHON_ENV=production \
    USE_LOCAL_STORAGE=true \
    LOCAL_STORAGE_PATH=/app/uploads \
    CELERY_BROKER_URL=redis://redis:6379/0 \
    CELERY_RESULT_BACKEND=redis://redis:6379/0 \
    VERTEX_AI_API_KEY="" \
    VERTEX_AI_ENDPOINT="https://aiplatform.googleapis.com/v1/publishers/google/models" \
    VERTEX_AI_GEMINI_MODEL="gemini-2.0-flash-exp" \
    VERTEX_AI_IMAGEN_MODEL="imagen-3.0-generate-001" \
    VERTEX_AI_VIDEO_MODEL="veo-3.1-generate-preview" \
    DATABASE_URL="postgresql://halo:halo@postgres:5432/halodocs"

# Backend listens on 8080 (matches docker-compose and /health check)
EXPOSE 8080

# Default command runs FastAPI backend via Uvicorn
# Celery worker is started by docker-compose overriding the command, e.g.:
#   command: celery -A celery_app worker --loglevel=info --concurrency=4
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
