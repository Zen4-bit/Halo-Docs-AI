# HALO Docs AI - Google Cloud Run Deployment Guide

## Project Information

| Field | Value |
|-------|-------|
| Project Name | My First Project |
| Project Number | 744261391903 |
| Project ID | `imposing-grail-476206-j6` |
| Region | `us-central1` |

---

## Prerequisites

### 1. Install Google Cloud SDK
```bash
# Windows - Download and run installer from:
# https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version
```

### 2. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth configure-docker
gcloud config set project imposing-grail-476206-j6
```

### 3. Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## Deployment Methods

### Method 1: PowerShell Script (Recommended for Windows)

```powershell
# Navigate to project root
cd "c:\Users\snnha\Desktop\New folder\Halo-Docs-AI"

# Deploy everything
.\cloud-run\deploy.ps1 -GeminiApiKey "YOUR_GEMINI_API_KEY"

# Deploy backend only
.\cloud-run\deploy.ps1 -BackendOnly -GeminiApiKey "YOUR_GEMINI_API_KEY"

# Deploy frontend only (requires backend to be deployed first)
.\cloud-run\deploy.ps1 -FrontendOnly
```

### Method 2: Cloud Build (CI/CD)

#### Deploy Backend
```bash
cd "c:\Users\snnha\Desktop\New folder\Halo-Docs-AI"

gcloud builds submit \
  --config=cloud-run/cloudbuild-backend.yaml \
  --substitutions=_REGION=us-central1
```

#### Deploy Frontend
```bash
# First, get the backend URL
BACKEND_URL=$(gcloud run services describe halo-docs-ai-backend \
  --region=us-central1 \
  --format="value(status.url)")

# Then deploy frontend
gcloud builds submit \
  --config=cloud-run/cloudbuild-frontend.yaml \
  --substitutions=_REGION=us-central1,_BACKEND_URL=$BACKEND_URL
```

### Method 3: Manual Docker Build & Deploy

#### Backend
```bash
# Build
docker build -f cloud-run/Dockerfile.backend -t gcr.io/imposing-grail-476206-j6/halo-docs-ai-backend .

# Push
docker push gcr.io/imposing-grail-476206-j6/halo-docs-ai-backend

# Deploy
gcloud run deploy halo-docs-ai-backend \
  --image gcr.io/imposing-grail-476206-j6/halo-docs-ai-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300s \
  --set-env-vars "GEMINI_API_KEY=YOUR_KEY,CORS_ORIGINS=*"
```

#### Frontend
```bash
# Build with backend URL
docker build -f cloud-run/Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_API_BASE=https://halo-docs-ai-backend-xxxxx-uc.a.run.app \
  -t gcr.io/imposing-grail-476206-j6/halo-docs-ai-frontend .

# Push
docker push gcr.io/imposing-grail-476206-j6/halo-docs-ai-frontend

# Deploy
gcloud run deploy halo-docs-ai-frontend \
  --image gcr.io/imposing-grail-476206-j6/halo-docs-ai-frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1
```

---

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API Key | Required |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `PYTHON_ENV` | Environment mode | `production` |
| `USE_LOCAL_STORAGE` | Use local file storage | `true` |
| `LOCAL_STORAGE_PATH` | Upload directory | `/app/uploads` |
| `MAX_UPLOAD_SIZE` | Max file size (bytes) | `209715200` (200MB) |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL | `https://halo-docs-ai-backend-xxxxx-uc.a.run.app` |
| `NODE_ENV` | Environment mode | `production` |

---

## Deployed URLs (Production)

| Service | URL |
|---------|-----|
| **Frontend** | https://halo-docs-ai-frontend-744261391903.us-west1.run.app |
| **Backend** | https://halo-docs-ai-backend-744261391903.us-west1.run.app |
| **API Docs** | https://halo-docs-ai-backend-744261391903.us-west1.run.app/docs |
| **Health Check** | https://halo-docs-ai-backend-744261391903.us-west1.run.app/health |

### Deployment Details
- **Region**: us-west1
- **Project ID**: imposing-grail-476206-j6
- **Deployed**: November 30, 2025

---

## Post-Deployment Configuration

### Update CORS After Getting URLs
```bash
# Get frontend URL
FRONTEND_URL=$(gcloud run services describe halo-docs-ai-frontend \
  --region=us-central1 --format="value(status.url)")

# Update backend CORS
gcloud run services update halo-docs-ai-backend \
  --region=us-central1 \
  --update-env-vars "CORS_ORIGINS=$FRONTEND_URL"
```

---

## Verification Checklist

### Backend Health Check
```bash
curl https://halo-docs-ai-backend-xxxxx-uc.a.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "services": {
    "pdf_tools": "operational",
    "office_tools": "operational",
    "media_tools": "operational",
    "ai_tools": "operational"
  }
}
```

### Test All Tools

#### PDF Tools (7 tools)
- [ ] Merge PDF - `/api/tools/merge-pdf`
- [ ] Split PDF - `/api/tools/split-pdf`
- [ ] Compress PDF - `/api/tools/compress-pdf`
- [ ] Rotate PDF - `/api/tools/rotate-pdf`
- [ ] Watermark PDF - `/api/tools/watermark-pdf`
- [ ] Page Numbers - `/api/tools/add-page-numbers`
- [ ] Repair PDF - `/api/tools/repair-pdf`

#### Office Tools (3 tools)
- [ ] Word to PDF - `/api/tools/word-to-pdf`
- [ ] Excel to PDF - `/api/tools/excel-to-pdf`
- [ ] PowerPoint to PDF - `/api/tools/pptx-to-pdf`

#### Media Tools (10+ tools)
- [ ] Image Compressor - `/api/tools/image-compressor`
- [ ] Image Cropper - `/api/tools/image-cropper`
- [ ] Image Resizer - `/api/tools/resize-image`
- [ ] Bulk Resizer - `/api/tools/bulk-resize`
- [ ] Video Downloader - `/api/tools/video-downloader`

#### AI Tools (6 tools)
- [ ] AI Chat - `/api/ai/chat` (streaming)
- [ ] Document Summary - `/api/ai/summarize`
- [ ] Translator - `/api/ai/translate`
- [ ] Rewriter - `/api/ai/rewrite`
- [ ] Insights - `/api/ai/insights`
- [ ] Image Studio - `/api/ai/image-studio/*`
  - [ ] Analyze Image
  - [ ] Enhance Prompt
  - [ ] Generate Variations
  - [ ] Generate Image from Prompt

---

## Troubleshooting

### Common Issues

#### 1. Build Timeout
```bash
# Increase timeout
gcloud builds submit --timeout=1800s ...
```

#### 2. Memory Issues
```bash
# Increase memory allocation
gcloud run services update SERVICE_NAME \
  --memory 4Gi --region us-central1
```

#### 3. CORS Errors
```bash
# Check current CORS settings
gcloud run services describe halo-docs-ai-backend \
  --region=us-central1 --format="yaml" | grep CORS

# Update CORS
gcloud run services update halo-docs-ai-backend \
  --region=us-central1 \
  --update-env-vars "CORS_ORIGINS=https://your-frontend-url.run.app"
```

#### 4. Cold Start Issues
```bash
# Set minimum instances to avoid cold starts
gcloud run services update SERVICE_NAME \
  --min-instances=1 --region us-central1
```

---

## Monitoring & Logs

### View Logs
```bash
# Backend logs
gcloud run services logs read halo-docs-ai-backend --region=us-central1

# Frontend logs
gcloud run services logs read halo-docs-ai-frontend --region=us-central1

# Stream logs in real-time
gcloud run services logs tail halo-docs-ai-backend --region=us-central1
```

### View Metrics
Visit: https://console.cloud.google.com/run?project=imposing-grail-476206-j6

---

## Cost Optimization

1. **Use `--min-instances=0`** to scale to zero when not in use
2. **Set appropriate `--memory` and `--cpu`** based on actual usage
3. **Enable Cloud CDN** for frontend static assets
4. **Use regional endpoints** closest to your users

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use Secret Manager** for sensitive values:
   ```bash
   gcloud secrets create gemini-api-key --data-file=./secret.txt
   gcloud run services update halo-docs-ai-backend \
     --set-secrets=GEMINI_API_KEY=gemini-api-key:latest
   ```
3. **Enable Cloud Armor** for DDoS protection
4. **Set up IAM policies** for access control

---

## File Structure

```
cloud-run/
├── Dockerfile.backend      # Backend Docker configuration
├── Dockerfile.frontend     # Frontend Docker configuration
├── cloudbuild-backend.yaml # Backend Cloud Build config
├── cloudbuild-frontend.yaml# Frontend Cloud Build config
├── deploy.ps1              # PowerShell deployment script
├── build-and-deploy.sh     # Bash deployment script
└── verify-deployment.sh    # Verification script
```

---

## Support

For issues, check:
1. Cloud Run logs in Google Cloud Console
2. Health endpoint: `/health`
3. API documentation: `/docs`

---

*Last updated: November 2024*
