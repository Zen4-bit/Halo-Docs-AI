@echo off
echo ================================================
echo HALO Platform - Installing Client-Side Dependencies
echo ================================================
echo.

cd apps\web

echo [1/3] Installing PDF Processing Libraries...
call npm install pdf-lib@^1.17.1 pdfjs-dist@^3.11.174

echo.
echo [2/3] Installing Office Document Libraries...
call npm install mammoth@^1.6.0 xlsx@^0.18.5 jspdf@^2.5.1 jspdf-autotable@^3.7.1 html2canvas@^1.4.1

echo.
echo [3/3] Installing Media Processing Libraries...
call npm install @ffmpeg/ffmpeg@^0.12.7 @ffmpeg/util@^0.12.1 browser-image-compression@^2.0.2

echo.
echo ================================================
echo Installing Type Definitions (optional)...
echo ================================================
call npm install --save-dev @types/pdfjs-dist @types/node

echo.
echo ================================================
echo ✅ Installation Complete!
echo ================================================
echo.
echo All dependencies have been installed.
echo You can now use the new client-side services:
echo   - PdfService (services/PdfService.ts)
echo   - OfficeService (services/OfficeService.ts)
echo   - MediaService (services/MediaService.ts)
echo   - AiService (services/AiService.ts)
echo.
echo Next steps:
echo 1. Update your tool pages to use the new services
echo 2. Replace fetch('/api/...') calls with service methods
echo 3. Add UI controls for advanced options
echo.
echo See HALO_CLIENT_SIDE_OVERHAUL.md for details.
echo.
pause
