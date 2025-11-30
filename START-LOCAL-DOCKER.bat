@echo off
REM ===========================================
REM HALO Docs AI - Local Docker Startup
REM ===========================================
REM Builds and runs all services locally
REM Backend: http://localhost:8080
REM Frontend: http://localhost:3000

echo.
echo =========================================
echo   HALO Docs AI - Local Docker Startup
echo =========================================
echo.

REM Check if .env file exists
if not exist "%~dp0.env" (
    echo [WARNING] .env file not found!
    echo.
    echo Please create a .env file with your API keys:
    echo   1. Copy .env.docker.template to .env
    echo   2. Fill in your VERTEX_AI_API_KEY
    echo.
    echo Creating .env from template...
    copy "%~dp0.env.docker.template" "%~dp0.env"
    echo.
    echo [!] Please edit .env and add your API keys, then run this again.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/3] Stopping any existing containers...
docker compose -f docker-compose.local.yml down 2>nul

echo.
echo [2/3] Building images locally (no online pulls for app)...
docker compose -f docker-compose.local.yml build --no-cache

echo.
echo [3/3] Starting services...
docker compose -f docker-compose.local.yml up -d

echo.
echo =========================================
echo   Services Starting...
echo =========================================
echo.
echo   Backend:  http://localhost:8080
echo   Frontend: http://localhost:3000
echo   Health:   http://localhost:8080/health
echo   API Docs: http://localhost:8080/docs
echo.
echo   View logs: docker compose -f docker-compose.local.yml logs -f
echo   Stop:      docker compose -f docker-compose.local.yml down
echo.
echo =========================================

REM Wait for services to be ready
echo.
echo Waiting for services to start (this may take a minute)...
timeout /t 30 /nobreak >nul

REM Check if backend is healthy
curl -s http://localhost:8080/health >nul 2>&1
if errorlevel 1 (
    echo [!] Backend may still be starting. Check logs with:
    echo     docker compose -f docker-compose.local.yml logs backend
) else (
    echo [OK] Backend is running at http://localhost:8080
)

REM Check if frontend is responding
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo [!] Frontend may still be starting. Check logs with:
    echo     docker compose -f docker-compose.local.yml logs frontend
) else (
    echo [OK] Frontend is running at http://localhost:3000
)

echo.
pause
