@echo off
title HALO Docs AI - Hybrid Deployment (Local Backend + Docker Frontend)
cd /d "%~dp0"

echo.
echo ========================================
echo   HALO Docs AI - Hybrid Deployment
echo ========================================
echo.
echo This will start:
echo - Backend: Local Python server on http://localhost:8080
echo - Frontend: Docker container on http://localhost:3000
echo.

echo [1/3] Starting local backend...
cd apps\api
start "HALO Backend" cmd /k "python main-simple.py"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Docker frontend...
cd ..\..
docker compose up frontend -d

echo [3/3] Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Access your application:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8080
echo - API Docs: http://localhost:8080/docs
echo.
echo To stop: docker compose down
echo.
pause
