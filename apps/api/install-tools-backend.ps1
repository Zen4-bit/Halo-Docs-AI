# HALO Docs AI - Tools Backend Installation Script
# PowerShell script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HALO Tools Backend - Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements-tools.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Python packages installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Some packages may have failed" -ForegroundColor Yellow
}

# Check system dependencies
Write-Host ""
Write-Host "Checking system dependencies..." -ForegroundColor Yellow

# Check Ghostscript
Write-Host "  Checking Ghostscript..." -NoNewline
try {
    $null = gs --version 2>&1
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "    Install: choco install ghostscript" -ForegroundColor Yellow
}

# Check LibreOffice
Write-Host "  Checking LibreOffice..." -NoNewline
try {
    $null = soffice --version 2>&1
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "    Install: choco install libreoffice" -ForegroundColor Yellow
}

# Check FFmpeg
Write-Host "  Checking FFmpeg..." -NoNewline
try {
    $null = ffmpeg -version 2>&1
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "    Install: choco install ffmpeg" -ForegroundColor Yellow
}

# Check Java
Write-Host "  Checking Java..." -NoNewline
try {
    $null = java -version 2>&1
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "    Install: choco install openjdk" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Yellow
Write-Host "  python main.py" -ForegroundColor White
Write-Host ""
Write-Host "Then visit:" -ForegroundColor Yellow
Write-Host "  http://localhost:8080/docs" -ForegroundColor White
Write-Host ""
Write-Host "For missing system dependencies, use:" -ForegroundColor Yellow
Write-Host "  choco install ghostscript libreoffice ffmpeg openjdk" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
