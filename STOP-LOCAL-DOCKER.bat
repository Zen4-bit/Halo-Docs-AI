@echo off
REM ===========================================
REM HALO Docs AI - Stop Local Docker
REM ===========================================

echo.
echo =========================================
echo   HALO Docs AI - Stopping Services
echo =========================================
echo.

docker compose -f docker-compose.local.yml down

echo.
echo All services stopped.
echo.
pause
