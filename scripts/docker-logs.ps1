# HALO Docs AI Docker Logs Script
# View logs for all services or specific service

param(
    [string]$Service = ""
)

Write-Host "📋 HALO Docs AI Docker Logs" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

if ($Service) {
    Write-Host "📋 Viewing logs for service: $Service" -ForegroundColor Yellow
    docker compose logs -f $Service
} else {
    Write-Host "📋 Viewing logs for all services" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    docker compose logs -f
}
