# ===========================================
# HALO Docs AI - Local Startup (No Docker)
# ===========================================
# Backend: http://localhost:8080
# Frontend: http://localhost:3000

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  HALO Docs AI - Local Startup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check/create .env
$EnvFile = Join-Path $ProjectRoot ".env"
$EnvTemplate = Join-Path $ProjectRoot ".env.docker.template"
if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvTemplate) {
        Copy-Item $EnvTemplate $EnvFile
        Write-Host "[!] Created .env from template" -ForegroundColor Yellow
        Write-Host "[!] Please edit .env and add your VERTEX_AI_API_KEY" -ForegroundColor Yellow
    }
}

# Load .env for this session
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "[OK] Loaded environment from .env" -ForegroundColor Green
}

# Start Backend
Write-Host ""
Write-Host "[1/2] Starting Backend on http://localhost:8080..." -ForegroundColor Yellow
$BackendPath = Join-Path $ProjectRoot "apps\api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; pip install -r requirements.txt -q 2>`$null; python main.py"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend on http://localhost:3000..." -ForegroundColor Yellow
$FrontendPath = Join-Path $ProjectRoot "apps\web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendPath'; npm install --legacy-peer-deps --silent 2>`$null; npm run dev"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Services Starting..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8080/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Two PowerShell windows opened for logs." -ForegroundColor Gray
Write-Host "  Close them to stop the services." -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
