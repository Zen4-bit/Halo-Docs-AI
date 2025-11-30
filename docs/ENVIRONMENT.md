# Environment Configuration Guide

This document describes all environment variables used in HALO Docs AI.

## Quick Setup

1. Copy `.env.example` to `.env` in the project root
2. Fill in required values
3. Restart services

## Environment Variables

### AI Configuration (Required for AI Features)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VERTEX_AI_API_KEY` | Yes* | - | Google Vertex AI API key |
| `VERTEX_AI_ENDPOINT` | No | `https://aiplatform.googleapis.com/v1/publishers/google/models` | Vertex AI endpoint URL |
| `VERTEX_AI_GEMINI_MODEL` | No | `gemini-2.0-flash-exp` | Gemini model to use |
| `VERTEX_AI_IMAGEN_MODEL` | No | `imagen-3.0-generate-001` | Imagen model for image generation |
| `VERTEX_AI_VIDEO_MODEL` | No | `veo-3.1-generate-preview` | Video generation model |

*Required only if you want to use AI features. The app works without it using mock responses.

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | SQLite | PostgreSQL connection string |
| `POSTGRES_USER` | No | `halo` | PostgreSQL username (Docker) |
| `POSTGRES_PASSWORD` | No | `halo` | PostgreSQL password (Docker) |
| `POSTGRES_DB` | No | `halodocs` | PostgreSQL database name |

### Redis & Celery (Task Queue)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CELERY_BROKER_URL` | No | - | Redis URL for Celery broker |
| `CELERY_RESULT_BACKEND` | No | - | Redis URL for Celery results |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL |

### Frontend Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE` | No | `http://localhost:8080/api/v1` | Backend API base URL |
| `NODE_ENV` | No | `development` | Node environment |

### Backend Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PYTHON_ENV` | No | `development` | Python environment |
| `API_PORT` | No | `8080` | Backend server port |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed CORS origins |
| `USE_LOCAL_STORAGE` | No | `true` | Use local file storage |
| `LOCAL_STORAGE_PATH` | No | `./uploads` | Local storage directory |

### Cloud Storage (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GCS_BUCKET_NAME` | No | - | Google Cloud Storage bucket |
| `AWS_S3_BUCKET` | No | - | AWS S3 bucket name |
| `AWS_ACCESS_KEY_ID` | No | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | No | - | AWS secret key |

### Email Service (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | No | - | Resend.com API key for emails |

### Monitoring (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | - | Sentry error tracking DSN |

## Configuration Files

### Development (`.env`)

```env
# AI (Optional - enables AI features)
VERTEX_AI_API_KEY=your_api_key

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1

# Database (Optional - defaults to SQLite)
# DATABASE_URL=postgresql://halo:halo@localhost:5432/halodocs
```

### Production (`.env.production`)

```env
# AI
VERTEX_AI_API_KEY=your_production_api_key

# Database
DATABASE_URL=postgresql://user:secure_password@db_host:5432/halodocs
POSTGRES_PASSWORD=secure_password

# Redis
CELERY_BROKER_URL=redis://redis_host:6379/0
CELERY_RESULT_BACKEND=redis://redis_host:6379/0

# Frontend
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api/v1
NODE_ENV=production

# Backend
PYTHON_ENV=production
CORS_ORIGINS=https://yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Docker (`.env.docker`)

```env
# Docker-specific settings
POSTGRES_USER=halo
POSTGRES_PASSWORD=halo_docker_password
POSTGRES_DB=halodocs

# Use Docker internal networking
NEXT_PUBLIC_API_BASE=http://backend:8080/api/v1
DATABASE_URL=postgresql://halo:halo_docker_password@postgres:5432/halodocs
CELERY_BROKER_URL=redis://redis:6379/0
```

## Getting API Keys

### Google Vertex AI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Vertex AI API
4. Create API credentials
5. Copy the API key to `VERTEX_AI_API_KEY`

### Resend (Email)

1. Sign up at [Resend.com](https://resend.com/)
2. Create an API key
3. Copy to `RESEND_API_KEY`

## Troubleshooting

### AI Features Not Working

1. Verify `VERTEX_AI_API_KEY` is set correctly
2. Check API key has proper permissions
3. Ensure billing is enabled on Google Cloud

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format
3. Ensure database exists

### CORS Errors

1. Add frontend URL to `CORS_ORIGINS`
2. Restart backend server
3. Clear browser cache
