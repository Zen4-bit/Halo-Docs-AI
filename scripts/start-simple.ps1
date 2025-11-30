# Simple HALO Docs AI Startup Script
Write-Host "Starting HALO Docs AI..." -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps\api'; python main.py"

# Wait 3 seconds for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps\web'; npm run dev"

Write-Host "HALO Docs AI is starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8080/docs" -ForegroundColor Cyan
