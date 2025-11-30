# HALO Docs AI - Health Monitor and Auto-Recovery
param(
    [int]$CheckInterval = 30,
    [int]$MaxRetries = 3,
    [switch]$AutoRestart
)

# Configuration
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$API_PORT = 8080
$WEB_PORT = 3000
$LOG_FILE = "$PROJECT_ROOT\logs\health-monitor.log"

# Ensure logs directory exists
$logsDir = "$PROJECT_ROOT\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LOG_FILE -Value $logEntry
}

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            return $true
        }
    } catch {
        Write-Log "Health check failed for $ServiceName`: $_" "ERROR"
        return $false
    }
    
    return $false
}

# Function to restart backend service
function Restart-BackendService {
    Write-Log "Attempting to restart backend service..." "WARN"
    
    try {
        # Kill existing processes on port
        $processes = netstat -ano | Select-String ":$API_PORT " | ForEach-Object {
            $fields = $_ -split '\s+' | Where-Object { $_ -ne '' }
            if ($fields.Length -ge 5) { $fields[4] }
        } | Sort-Object -Unique
        
        foreach ($processId in $processes) {
            if ($processId -and $processId -ne "0") {
                taskkill /PID $processId /F 2>$null
                Write-Log "Killed process $processId on port $API_PORT" "INFO"
            }
        }
        
        Start-Sleep -Seconds 3
        
        # Start new backend process
        Push-Location "$PROJECT_ROOT\apps\api"
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "powershell.exe"
        $startInfo.Arguments = "-Command `"& '.\venv\Scripts\Activate.ps1'; python main.py`""
        $startInfo.WorkingDirectory = $PWD.Path
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $true
        
        $backendProcess = [System.Diagnostics.Process]::Start($startInfo)
        Pop-Location
        
        # Wait for service to be healthy
        Start-Sleep -Seconds 10
        
        if (Test-ServiceHealth -Url "http://localhost:$API_PORT/health" -ServiceName "Backend") {
            Write-Log "Backend service restarted successfully" "INFO"
            return $true
        } else {
            Write-Log "Backend service restart failed" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to restart backend service: $_" "ERROR"
        return $false
    }
}

# Function to restart frontend service
function Restart-FrontendService {
    Write-Log "Attempting to restart frontend service..." "WARN"
    
    try {
        # Kill existing processes on port
        $processes = netstat -ano | Select-String ":$WEB_PORT " | ForEach-Object {
            $fields = $_ -split '\s+' | Where-Object { $_ -ne '' }
            if ($fields.Length -ge 5) { $fields[4] }
        } | Sort-Object -Unique
        
        foreach ($processId in $processes) {
            if ($processId -and $processId -ne "0") {
                taskkill /PID $processId /F 2>$null
                Write-Log "Killed process $processId on port $WEB_PORT" "INFO"
            }
        }
        
        Start-Sleep -Seconds 3
        
        # Start new frontend process
        Push-Location "$PROJECT_ROOT\apps\web"
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "npm.cmd"
        $startInfo.Arguments = "run dev"
        $startInfo.WorkingDirectory = $PWD.Path
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $true
        
        $frontendProcess = [System.Diagnostics.Process]::Start($startInfo)
        Pop-Location
        
        # Wait for service to be ready
        Start-Sleep -Seconds 15
        
        if (Test-ServiceHealth -Url "http://localhost:$WEB_PORT" -ServiceName "Frontend") {
            Write-Log "Frontend service restarted successfully" "INFO"
            return $true
        } else {
            Write-Log "Frontend service restart failed" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to restart frontend service: $_" "ERROR"
        return $false
    }
}

# Main monitoring loop
Write-Log "Starting HALO Docs AI Health Monitor" "INFO"
Write-Log "Check interval: $CheckInterval seconds" "INFO"
Write-Log "Auto-restart: $AutoRestart" "INFO"

$backendFailures = 0
$frontendFailures = 0

while ($true) {
    try {
        # Check backend health
        if (Test-ServiceHealth -Url "http://localhost:$API_PORT/health" -ServiceName "Backend") {
            $backendFailures = 0
            Write-Log "Backend health check: OK" "INFO"
        } else {
            $backendFailures++
            Write-Log "Backend health check: FAILED (attempt $backendFailures/$MaxRetries)" "WARN"
            
            if ($AutoRestart -and $backendFailures -ge $MaxRetries) {
                if (Restart-BackendService) {
                    $backendFailures = 0
                } else {
                    Write-Log "Backend restart failed after $MaxRetries attempts" "ERROR"
                }
            }
        }
        
        # Check frontend health
        if (Test-ServiceHealth -Url "http://localhost:$WEB_PORT" -ServiceName "Frontend") {
            $frontendFailures = 0
            Write-Log "Frontend health check: OK" "INFO"
        } else {
            $frontendFailures++
            Write-Log "Frontend health check: FAILED (attempt $frontendFailures/$MaxRetries)" "WARN"
            
            if ($AutoRestart -and $frontendFailures -ge $MaxRetries) {
                if (Restart-FrontendService) {
                    $frontendFailures = 0
                } else {
                    Write-Log "Frontend restart failed after $MaxRetries attempts" "ERROR"
                }
            }
        }
        
        Start-Sleep -Seconds $CheckInterval
        
    } catch {
        Write-Log "Monitor error: $_" "ERROR"
        Start-Sleep -Seconds $CheckInterval
    }
}
