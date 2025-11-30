# HALO Docs AI Docker Setup Script
# This script sets up and starts all Docker services

Write-Host "🚀 HALO Docs AI Docker Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "📋 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.docker") {
        Write-Host "📋 Copying .env.docker to .env..." -ForegroundColor Yellow
        Copy-Item ".env.docker" ".env"
        Write-Host "✅ Environment file created" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env file with your actual API keys" -ForegroundColor Yellow
    } else {
        Write-Host "❌ No environment file found. Please create .env from .env.docker" -ForegroundColor Red
        exit 1
    }
}

# Stop any existing containers
Write-Host "📋 Stopping existing containers..." -ForegroundColor Yellow
docker compose down

# Build and start services
Write-Host "📋 Building and starting services..." -ForegroundColor Yellow
docker compose up --build -d

# Wait for services to be healthy
Write-Host "📋 Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "📋 Checking service health..." -ForegroundColor Yellow

$services = @("postgres", "redis", "api", "web")
foreach ($service in $services) {
    $status = docker compose ps --format json | ConvertFrom-Json | Where-Object { $_.Service -eq $service }
    if ($status.State -eq "running") {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8080/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "  docker compose logs -f          # View logs"
Write-Host "  docker compose down             # Stop services"
Write-Host "  docker compose up -d            # Start services"
Write-Host "  docker compose restart <service> # Restart specific service"
