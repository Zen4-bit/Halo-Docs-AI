@echo off
REM ===========================================
REM HALO Docs AI - Local Startup (No Docker)
REM ===========================================
REM Backend: http://localhost:8080
REM Frontend: http://localhost:3000

echo.
echo =========================================
echo   HALO Docs AI - Local Startup
echo =========================================
echo.

REM Check if .env exists
if not exist "%~dp0.env" (
    echo [!] Creating .env from template...
    copy "%~dp0.env.docker.template" "%~dp0.env"
    echo [!] Please edit .env and add your VERTEX_AI_API_KEY
)

echo Starting Backend on http://localhost:8080...
start "HALO Backend" cmd /k "cd /d %~dp0apps\api && pip install -r requirements.txt -q && python main.py"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend on http://localhost:3000...
start "HALO Frontend" cmd /k "cd /d %~dp0apps\web && npm install --legacy-peer-deps --silent && npm run dev"

echo.
echo =========================================
echo   Services Starting...
echo =========================================
echo.
echo   Backend:  http://localhost:8080
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8080/docs
echo.
echo   Two terminal windows opened for logs.
echo   Close them to stop the services.
echo =========================================
echo.
pause
