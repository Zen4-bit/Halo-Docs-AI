# HALO Docs AI - Google Cloud Run Deployment Script
# PowerShell script for Windows deployment

param(
    [string]$ProjectId = "imposing-grail-476206-j6",
    [string]$Region = "us-central1",
    [string]$GeminiApiKey = "",
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# Configuration
$BackendServiceName = "halo-docs-ai-backend"
$FrontendServiceName = "halo-docs-ai-frontend"
$BackendImageName = "gcr.io/$ProjectId/halo-docs-ai-backend"
$FrontendImageName = "gcr.io/$ProjectId/halo-docs-ai-frontend"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " HALO Docs AI - Google Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project ID: $ProjectId" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Check gcloud CLI
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: gcloud CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK from: https://cloud.google.com/sdk/install" -ForegroundColor Red
    exit 1
}

# Set project
Write-Host "Setting Google Cloud project..." -ForegroundColor Green
gcloud config set project $ProjectId

# Enable required APIs
Write-Host "Enabling required Cloud APIs..." -ForegroundColor Green
gcloud services enable run.googleapis.com --quiet
gcloud services enable artifactregistry.googleapis.com --quiet
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet

# Get project root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "Project root: $ProjectRoot" -ForegroundColor Gray

# ============================================================
# BACKEND DEPLOYMENT
# ============================================================
if (-not $FrontendOnly) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " BACKEND DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    
    if (-not $SkipBuild) {
        Write-Host "Building backend Docker image..." -ForegroundColor Green
        
        Push-Location $ProjectRoot
        try {
            gcloud builds submit `
                --tag "$BackendImageName`:latest" `
                --timeout=1200s `
                --machine-type=e2-highcpu-8 `
                -f "cloud-run/Dockerfile.backend" `
                .
        }
        finally {
            Pop-Location
        }
    }
    
    Write-Host "Deploying backend to Cloud Run..." -ForegroundColor Green
    
    # Prepare environment variables
    $EnvVars = @(
        "PYTHON_ENV=production",
        "CORS_ORIGINS=*",
        "USE_LOCAL_STORAGE=true",
        "LOCAL_STORAGE_PATH=/app/uploads",
        "MAX_UPLOAD_SIZE=209715200"
    )
    
    if ($GeminiApiKey) {
        $EnvVars += "GEMINI_API_KEY=$GeminiApiKey"
    }
    
    $EnvVarsString = $EnvVars -join ","
    
    $BackendUrl = gcloud run deploy $BackendServiceName `
        --image "$BackendImageName`:latest" `
        --region $Region `
        --platform managed `
        --allow-unauthenticated `
        --memory 4Gi `
        --cpu 2 `
        --timeout 300s `
        --min-instances 0 `
        --max-instances 10 `
        --concurrency 80 `
        --set-env-vars $EnvVarsString `
        --format "value(status.url)"
    
    Write-Host ""
    Write-Host "Backend deployed successfully!" -ForegroundColor Green
    Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
}

# ============================================================
# FRONTEND DEPLOYMENT
# ============================================================
if (-not $BackendOnly) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " FRONTEND DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    
    # Get backend URL if not already set
    if (-not $BackendUrl) {
        $BackendUrl = gcloud run services describe $BackendServiceName `
            --region $Region `
            --format "value(status.url)" 2>$null
        
        if (-not $BackendUrl) {
            Write-Host "ERROR: Backend not deployed. Deploy backend first!" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "Using backend URL: $BackendUrl" -ForegroundColor Gray
    
    if (-not $SkipBuild) {
        Write-Host "Building frontend Docker image..." -ForegroundColor Green
        
        Push-Location $ProjectRoot
        try {
            gcloud builds submit `
                --tag "$FrontendImageName`:latest" `
                --timeout=1200s `
                --machine-type=e2-highcpu-8 `
                -f "cloud-run/Dockerfile.frontend" `
                --substitutions="_NEXT_PUBLIC_API_BASE=$BackendUrl" `
                .
        }
        finally {
            Pop-Location
        }
    }
    
    Write-Host "Deploying frontend to Cloud Run..." -ForegroundColor Green
    
    $FrontendUrl = gcloud run deploy $FrontendServiceName `
        --image "$FrontendImageName`:latest" `
        --region $Region `
        --platform managed `
        --allow-unauthenticated `
        --memory 1Gi `
        --cpu 1 `
        --timeout 60s `
        --min-instances 0 `
        --max-instances 10 `
        --concurrency 100 `
        --set-env-vars "NEXT_PUBLIC_API_BASE=$BackendUrl,NODE_ENV=production" `
        --format "value(status.url)"
    
    Write-Host ""
    Write-Host "Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Yellow
    
    # Update backend CORS with frontend URL
    Write-Host ""
    Write-Host "Updating backend CORS configuration..." -ForegroundColor Green
    gcloud run services update $BackendServiceName `
        --region $Region `
        --update-env-vars "CORS_ORIGINS=$FrontendUrl,http://localhost:3000"
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if ($BackendUrl) {
    Write-Host "Backend URL:  $BackendUrl" -ForegroundColor Cyan
    Write-Host "  - API Docs: $BackendUrl/docs" -ForegroundColor Gray
    Write-Host "  - Health:   $BackendUrl/health" -ForegroundColor Gray
}

if ($FrontendUrl) {
    Write-Host ""
    Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Visit the Frontend URL to test the application"
Write-Host "2. Test API endpoints at Backend URL/docs"
Write-Host "3. Verify all tools are working"
Write-Host ""

# Output environment variables for reference
Write-Host "Environment Variables for .env.production:" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_API_BASE=$BackendUrl"
