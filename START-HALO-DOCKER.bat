@echo off
title HALO Docs AI - Docker Startup
cd /d "%~dp0"
echo Starting HALO Docs AI with Docker...
docker compose up --build -d
echo.
echo Services starting...
timeout /t 5 >nul
docker compose ps
echo.
echo Access the application at http://localhost:3000
pause
