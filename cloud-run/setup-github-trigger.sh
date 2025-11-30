#!/bin/bash

# HALO AI Platform - GitHub Cloud Build Trigger Setup
# Creates automatic deployment triggers for GitHub pushes

set -e

# Configuration
PROJECT_ID="imposing-grail-476206-j6"
REGION="us-central1"
REPO_OWNER="your-github-username"  # Replace with actual GitHub username
REPO_NAME="halo-ai-platform"      # Replace with actual repository name

echo "🔧 Setting up GitHub Cloud Build triggers..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling Cloud Build and GitHub integration APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sourcerepo.googleapis.com

# Create backend trigger
echo "🔨 Creating backend deployment trigger..."
gcloud builds triggers create github \
    --repo-name="$REPO_NAME" \
    --repo-owner="$REPO_OWNER" \
    --branch-pattern="^main$" \
    --build-config="cloud-run/cloudbuild-backend.yaml" \
    --description="Deploy HALO AI Backend on main branch push" \
    --name="halo-backend-deploy"

# Create frontend trigger (depends on backend)
echo "🔨 Creating frontend deployment trigger..."
gcloud builds triggers create github \
    --repo-name="$REPO_NAME" \
    --repo-owner="$REPO_OWNER" \
    --branch-pattern="^main$" \
    --build-config="cloud-run/cloudbuild-frontend.yaml" \
    --description="Deploy HALO AI Frontend on main branch push" \
    --name="halo-frontend-deploy"

echo ""
echo "✅ GitHub triggers created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update REPO_OWNER and REPO_NAME in this script with your actual GitHub details"
echo "2. Connect your GitHub repository to Google Cloud Build:"
echo "   - Go to: https://console.cloud.google.com/cloud-build/triggers"
echo "   - Click 'Connect Repository' and follow the GitHub authorization flow"
echo "3. Push changes to main branch to trigger automatic deployment"
echo ""
echo "🔗 Trigger URLs:"
echo "- Backend: https://console.cloud.google.com/cloud-build/triggers;region=$REGION"
echo "- Frontend: https://console.cloud.google.com/cloud-build/triggers;region=$REGION"
