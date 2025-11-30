@echo off
title HALO Docs AI - One-Click Startup
cd /d "%~dp0"
echo Starting HALO Docs AI...
powershell -ExecutionPolicy Bypass -File "scripts\start-halo.ps1"
pause
