#!/bin/bash

# HALO AI Platform - Deployment Verification Script
# Verifies that both frontend and backend services are running correctly

set -e

# Configuration
PROJECT_ID="imposing-grail-476206-j6"
REGION="us-central1"
BACKEND_SERVICE_NAME="halo-ai-backend"
FRONTEND_SERVICE_NAME="halo-ai-frontend"

echo "🔍 Verifying HALO AI Platform deployment..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Get service URLs
echo "📋 Getting service URLs..."
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE_NAME --region=$REGION --format='value(status.url)' 2>/dev/null || echo "")
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME --region=$REGION --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "❌ One or both services are not deployed yet."
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    exit 1
fi

echo "✅ Services found:"
echo "🔧 Backend: $BACKEND_URL"
echo "📱 Frontend: $FRONTEND_URL"

# Test backend health
echo ""
echo "🏥 Testing backend health..."
BACKEND_HEALTH=$(curl -s -w "%{http_code}" "$BACKEND_URL/health" -o /tmp/backend_health.json)
HTTP_CODE="${BACKEND_HEALTH: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend health check passed"
    cat /tmp/backend_health.json | jq '.' 2>/dev/null || cat /tmp/backend_health.json
else
    echo "❌ Backend health check failed (HTTP $HTTP_CODE)"
    curl -s "$BACKEND_URL/health"
    exit 1
fi

# Test frontend availability
echo ""
echo "🌐 Testing frontend availability..."
FRONTEND_HEALTH=$(curl -s -w "%{http_code}" "$FRONTEND_URL/" -o /tmp/frontend_health.html)
HTTP_CODE="${FRONTEND_HEALTH: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend is accessible"
    echo "Page size: $(wc -c < /tmp/frontend_health.html) bytes"
else
    echo "❌ Frontend not accessible (HTTP $HTTP_CODE)"
    exit 1
fi

# Test API connectivity from frontend perspective
echo ""
echo "🔗 Testing API connectivity..."
API_TEST=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/v1/health" -o /tmp/api_test.json 2>/dev/null || echo "000")
HTTP_CODE="${API_TEST: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API endpoint accessible"
else
    echo "⚠️  API endpoint returned HTTP $HTTP_CODE (may be expected for some endpoints)"
fi

# Check environment variables
echo ""
echo "🔧 Checking service configuration..."

echo "Backend environment variables:"
gcloud run services describe $BACKEND_SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep -E "(VERTEX_AI|PYTHON_ENV)" || echo "No critical env vars found"

echo ""
echo "Frontend environment variables:"
gcloud run services describe $FRONTEND_SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep "NEXT_PUBLIC_API_BASE" || echo "API_BASE not configured"

# Check service status
echo ""
echo "📊 Service Status:"
echo "Backend:"
gcloud run services describe $BACKEND_SERVICE_NAME --region=$REGION --format='table(status.url, status.latestReadyRevisionName, spec.template.spec.containers[0].resources.limits.memory, spec.template.spec.containers[0].resources.limits.cpu)'

echo ""
echo "Frontend:"
gcloud run services describe $FRONTEND_SERVICE_NAME --region=$REGION --format='table(status.url, status.latestReadyRevisionName, spec.template.spec.containers[0].resources.limits.memory, spec.template.spec.containers[0].resources.limits.cpu)'

# Cleanup temp files
rm -f /tmp/backend_health.json /tmp/frontend_health.html /tmp/api_test.json

echo ""
echo "🎉 Deployment verification completed!"
echo ""
echo "📱 Access your HALO AI Platform:"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BACKEND_URL/api/v1"
echo "Backend Health: $BACKEND_URL/health"
echo ""
echo "📋 Next steps:"
echo "1. Test the frontend in your browser"
echo "2. Configure Vertex AI API key in Google Cloud Console"
echo "3. Set up monitoring and alerts as needed"
