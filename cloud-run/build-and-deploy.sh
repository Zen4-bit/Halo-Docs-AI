#!/bin/bash

# HALO AI Platform - Cloud Run Build and Deploy Script
# Deploys both frontend and backend to Google Cloud Run

set -e

# Configuration
PROJECT_ID="imposing-grail-476206-j6"
REGION="us-central1"
BACKEND_SERVICE_NAME="halo-ai-backend"
FRONTEND_SERVICE_NAME="halo-ai-frontend"
BACKEND_IMAGE_NAME="halo-ai-backend"
FRONTEND_IMAGE_NAME="halo-ai-frontend"

echo "🚀 Starting HALO AI Platform deployment to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and deploy backend
echo "🔨 Building backend container..."
cd "$(dirname "$0")/.."

gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME \
    --timeout=600 \
    --machine-type=e2-highmem-4 \
    --cloud-build-config=cloud-run/cloudbuild-backend.yaml

echo "🚀 Deploying backend to Cloud Run..."
BACKEND_URL=$(gcloud run deploy $BACKEND_SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --timeout 300s \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "VERTEX_AI_PROJECT_ID=$PROJECT_ID" \
    --set-env-vars "VERTEX_AI_LOCATION=$REGION" \
    --format 'value(status.url)')

echo "✅ Backend deployed at: $BACKEND_URL"

# Build and deploy frontend
echo "🔨 Building frontend container..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$FRONTEND_IMAGE_NAME \
    --timeout=600 \
    --machine-type=e2-highmem-4 \
    --cloud-build-config=cloud-run/cloudbuild-frontend.yaml

echo "🚀 Deploying frontend to Cloud Run..."
FRONTEND_URL=$(gcloud run deploy $FRONTEND_SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$FRONTEND_IMAGE_NAME \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300s \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NEXT_PUBLIC_API_BASE=$BACKEND_URL/api/v1" \
    --format 'value(status.url)')

echo "✅ Frontend deployed at: $FRONTEND_URL"

# Configure CORS on backend
echo "🔧 Configuring CORS on backend..."
gcloud run services update $BACKEND_SERVICE_NAME \
    --region $REGION \
    --set-env-vars "CORS_ORIGINS=$FRONTEND_URL"

echo ""
echo "🎉 Deployment completed successfully!"
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL: $BACKEND_URL"
echo ""
echo "📋 Next steps:"
echo "1. Visit $FRONTEND_URL to test the application"
echo "2. Set up Vertex AI API key in Google Cloud Console"
echo "3. Configure monitoring and logging as needed"
