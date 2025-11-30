# HALO Docs AI - One-Click Startup Script
# This script handles all startup, error recovery, and service management
param(
    [switch]$Docker,
    [switch]$Local,
    [switch]$Force,
    [switch]$Verbose
)

# Color functions for better output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
function Write-Step { param($Message) Write-Host "🔄 $Message" -ForegroundColor Blue }

# Configuration
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$API_PORT = 8080
$WEB_PORT = 3000

# Global variables for process tracking
$global:BackendProcess = $null
$global:FrontendProcess = $null

Write-Host @"
🚀 HALO Docs AI - One-Click Startup
====================================
Project: $PROJECT_ROOT
Mode: $(if($Docker) { "Docker" } else { "Local Development" })
"@ -ForegroundColor Magenta

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param([int]$Port)
    
    try {
        $processes = netstat -ano | Select-String ":$Port " | ForEach-Object {
            $fields = $_ -split '\s+' | Where-Object { $_ -ne '' }
            if ($fields.Length -ge 5) { $fields[4] }
        } | Sort-Object -Unique
        
        foreach ($processId in $processes) {
            if ($processId -and $processId -ne "0") {
                Write-Warning "Killing process $processId on port $Port"
                taskkill /PID $processId /F 2>$null
                Start-Sleep -Seconds 1
            }
        }
    } catch {
        Write-Verbose "No processes found on port $Port"
    }
}

# Function to check if port is available
function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# Function to wait for service health
function Wait-ForService {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 30,
        [string]$ServiceName = "Service"
    )
    
    Write-Step "Waiting for $ServiceName to be healthy..."
    $elapsed = 0
    
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "$ServiceName is healthy!"
                return $true
            }
        } catch {
            # Service not ready yet
        }
        
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    Write-Error "$ServiceName failed to start within $TimeoutSeconds seconds"
    return $false
}

# Function to check and install dependencies
function Initialize-Environment {
    Write-Step "Checking environment..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    }
    
    # Check Python
    try {
        $pythonVersion = python --version 2>$null
        Write-Success "Python: $pythonVersion"
    } catch {
        Write-Error "Python not found. Please install Python 3.8+ from https://python.org/"
        exit 1
    }
    
    # Check Docker (if Docker mode)
    if ($Docker) {
        try {
            docker --version | Out-Null
            Write-Success "Docker is available"
        } catch {
            Write-Error "Docker not found. Please install Docker Desktop"
            exit 1
        }
    }
}

# Function to setup backend dependencies
function Initialize-Backend {
    Write-Step "Setting up backend dependencies..."
    
    Push-Location "$PROJECT_ROOT\apps\api"
    try {
        # Check if virtual environment exists
        if (-not (Test-Path "venv")) {
            Write-Step "Creating Python virtual environment..."
            python -m venv venv
        }
        
        # Activate virtual environment
        & ".\venv\Scripts\Activate.ps1"
        
        # Install/update requirements
        Write-Step "Installing Python dependencies..."
        pip install -r requirements.txt --quiet --disable-pip-version-check
        
        Write-Success "Backend dependencies ready"
    } catch {
        Write-Error "Failed to setup backend: $_"
        exit 1
    } finally {
        Pop-Location
    }
}

# Function to setup frontend dependencies
function Initialize-Frontend {
    Write-Step "Setting up frontend dependencies..."
    
    Push-Location "$PROJECT_ROOT\apps\web"
    try {
        # Check if node_modules exists or package.json changed
        if (-not (Test-Path "node_modules") -or $Force) {
            Write-Step "Installing Node.js dependencies..."
            npm install --legacy-peer-deps --no-audit --no-fund --silent
        }
        
        Write-Success "Frontend dependencies ready"
    } catch {
        Write-Error "Failed to setup frontend: $_"
        exit 1
    } finally {
        Pop-Location
    }
}

# Function to start backend service
function Start-BackendService {
    Write-Step "Starting backend service..."
    
    # Clear port if needed
    if (-not (Test-PortAvailable -Port $API_PORT)) {
        Write-Warning "Port $API_PORT is busy, clearing it..."
        Stop-ProcessOnPort -Port $API_PORT
        Start-Sleep -Seconds 2
    }
    
    Push-Location "$PROJECT_ROOT\apps\api"
    try {
        # Activate virtual environment and start server
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-Command `"& '.\venv\Scripts\Activate.ps1'; python main.py`""
        $startInfo.WorkingDirectory = $PWD.Path
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $false
        
        $global:BackendProcess = [System.Diagnostics.Process]::Start($startInfo)
        
        # Wait for service to be healthy
        if (Wait-ForService -Url "http://localhost:$API_PORT/health" -ServiceName "Backend API") {
            Write-Success "Backend service started successfully on port $API_PORT"
            return $true
        } else {
            Write-Error "Backend service failed to start"
            return $false
        }
    } catch {
        Write-Error "Failed to start backend: $_"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to start frontend service
function Start-FrontendService {
    Write-Step "Starting frontend service..."
    
    # Clear port if needed
    if (-not (Test-PortAvailable -Port $WEB_PORT)) {
        Write-Warning "Port $WEB_PORT is busy, clearing it..."
        Stop-ProcessOnPort -Port $WEB_PORT
        Start-Sleep -Seconds 2
    }
    
    Push-Location "$PROJECT_ROOT\apps\web"
    try {
        # Start Next.js development server
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "npm.cmd"
        $startInfo.Arguments = "run dev"
        $startInfo.WorkingDirectory = $PWD.Path
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $false
        
        $global:FrontendProcess = [System.Diagnostics.Process]::Start($startInfo)
        
        # Wait for service to be ready
        if (Wait-ForService -Url "http://localhost:$WEB_PORT" -ServiceName "Frontend" -TimeoutSeconds 45) {
            Write-Success "Frontend service started successfully on port $WEB_PORT"
            return $true
        } else {
            Write-Error "Frontend service failed to start"
            return $false
        }
    } catch {
        Write-Error "Failed to start frontend: $_"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to start Docker services
function Start-DockerServices {
    Write-Step "Starting Docker services..."
    
    Push-Location $PROJECT_ROOT
    try {
        # Stop any existing containers
        docker-compose down 2>$null
        
        # Start services
        Write-Step "Building and starting containers..."
        docker-compose up -d --build
        
        # Wait for services
        Write-Step "Waiting for services to be healthy..."
        Start-Sleep -Seconds 10
        
        # Check backend health
        if (Wait-ForService -Url "http://localhost:$API_PORT/health" -ServiceName "Backend (Docker)") {
            Write-Success "Docker backend is healthy"
        } else {
            Write-Error "Docker backend failed to start"
            return $false
        }
        
        # Check frontend
        if (Wait-ForService -Url "http://localhost:$WEB_PORT" -ServiceName "Frontend (Docker)" -TimeoutSeconds 60) {
            Write-Success "Docker frontend is healthy"
        } else {
            Write-Error "Docker frontend failed to start"
            return $false
        }
        
        return $true
    } catch {
        Write-Error "Failed to start Docker services: $_"
        return $false
    } finally {
        Pop-Location
    }
}

# Function to monitor services
function Start-ServiceMonitor {
    Write-Info "Starting service monitor..."
    
    $monitorScript = {
        param($ApiPort, $WebPort, $ProjectRoot)
        
        while ($true) {
            Start-Sleep -Seconds 30
            
            # Check backend
            try {
                Invoke-WebRequest -Uri "http://localhost:$ApiPort/health" -TimeoutSec 5 | Out-Null
            } catch {
                Write-Warning "Backend health check failed, attempting restart..."
                # Could add restart logic here
            }
            
            # Check frontend
            try {
                Invoke-WebRequest -Uri "http://localhost:$WebPort" -TimeoutSec 5 | Out-Null
            } catch {
                Write-Warning "Frontend health check failed"
                # Could add restart logic here
            }
        }
    }
    
    Start-Job -ScriptBlock $monitorScript -ArgumentList $API_PORT, $WEB_PORT, $PROJECT_ROOT | Out-Null
}

# Cleanup function
function Stop-Services {
    Write-Step "Stopping services..."
    
    if ($global:BackendProcess -and -not $global:BackendProcess.HasExited) {
        $global:BackendProcess.Kill()
        Write-Info "Backend process stopped"
    }
    
    if ($global:FrontendProcess -and -not $global:FrontendProcess.HasExited) {
        $global:FrontendProcess.Kill()
        Write-Info "Frontend process stopped"
    }
    
    if ($Docker) {
        Push-Location $PROJECT_ROOT
        docker-compose down 2>$null
        Pop-Location
        Write-Info "Docker services stopped"
    }
    
    # Stop monitoring jobs
    Get-Job | Stop-Job
    Get-Job | Remove-Job
}

# Handle Ctrl+C gracefully
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-Services
}

# Main execution
try {
    Write-Step "Initializing HALO Docs AI..."
    
    # Set default mode if neither specified
    if (-not $Docker -and -not $Local) {
        $Local = $true
    }
    
    # Step 1: Environment check
    Initialize-Environment
    
    if ($Docker) {
        # Docker mode
        Write-Info "Starting in Docker mode..."
        if (-not (Start-DockerServices)) {
            Write-Error "Failed to start Docker services"
            exit 1
        }
    } else {
        # Local development mode
        Write-Info "Starting in Local Development mode..."
        
        # Step 2: Setup dependencies
        Initialize-Backend
        Initialize-Frontend
        
        # Step 3: Start services
        if (-not (Start-BackendService)) {
            Write-Error "Failed to start backend service"
            exit 1
        }
        
        Start-Sleep -Seconds 3
        
        if (-not (Start-FrontendService)) {
            Write-Error "Failed to start frontend service"
            Stop-Services
            exit 1
        }
    }
    
    # Step 4: Start monitoring
    Start-ServiceMonitor
    
    # Success message
    Write-Host @"

🎉 HALO Docs AI is now running successfully!
============================================
Frontend: http://localhost:$WEB_PORT
Backend API: http://localhost:$API_PORT
API Docs: http://localhost:$API_PORT/docs
Health Check: http://localhost:$API_PORT/health

Press Ctrl+C to stop all services
"@ -ForegroundColor Green
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } catch {
        # User pressed Ctrl+C
    }
    
} catch {
    Write-Error "Startup failed: $_"
    exit 1
} finally {
    Stop-Services
}
