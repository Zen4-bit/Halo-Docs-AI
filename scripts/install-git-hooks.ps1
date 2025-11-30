# ===========================================
# HALO Docs AI - Install Git Hooks
# ===========================================
# This script installs a pre-commit hook that blocks
# accidental commits of .env files and API keys
# Run this once after cloning the repository

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  HALO Docs AI - Git Hooks Installer" -ForegroundColor Cyan  
Write-Host "=========================================" -ForegroundColor Cyan

# Get the project root (parent of scripts directory)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$GitHooksDir = Join-Path $ProjectRoot ".git\hooks"

# Check if .git directory exists
if (-not (Test-Path (Join-Path $ProjectRoot ".git"))) {
    Write-Host "ERROR: No .git directory found. Initialize git first." -ForegroundColor Red
    exit 1
}

# Create hooks directory if it doesn't exist
if (-not (Test-Path $GitHooksDir)) {
    New-Item -ItemType Directory -Path $GitHooksDir -Force | Out-Null
}

# Pre-commit hook content
$PreCommitHook = @'
#!/bin/bash
# ===========================================
# HALO Docs AI - Pre-Commit Security Hook
# ===========================================
# Blocks commits containing sensitive files

echo "🔒 Running security check..."

# Define sensitive file patterns
SENSITIVE_PATTERNS=(
    "\.env$"
    "\.env\.local$"
    "\.env\.[^.]+\.local$"
    "\.key$"
    "credentials"
    "service-account.*\.json$"
    "google-credentials.*\.json$"
    "\.pem$"
    "api[_-]?key"
)

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

BLOCKED=0
BLOCKED_FILES=""

for FILE in $STAGED_FILES; do
    for PATTERN in "${SENSITIVE_PATTERNS[@]}"; do
        if echo "$FILE" | grep -iE "$PATTERN" > /dev/null 2>&1; then
            # Allow template/example files
            if echo "$FILE" | grep -iE "\.(example|template|sample)$" > /dev/null 2>&1; then
                continue
            fi
            if echo "$FILE" | grep -iE "\.example$|\.template$|example\." > /dev/null 2>&1; then
                continue
            fi
            BLOCKED=1
            BLOCKED_FILES="$BLOCKED_FILES\n  - $FILE"
        fi
    done
done

if [ $BLOCKED -eq 1 ]; then
    echo ""
    echo "❌ COMMIT BLOCKED - Sensitive files detected!" 
    echo ""
    echo "The following files appear to contain secrets or API keys:"
    echo -e "$BLOCKED_FILES"
    echo ""
    echo "These files should NEVER be committed to git."
    echo ""
    echo "To fix this:"
    echo "  1. Remove them from staging: git reset HEAD <file>"
    echo "  2. Add them to .gitignore if not already"
    echo "  3. Use .env.example or .env.template for sharing configs"
    echo ""
    echo "To bypass (NOT RECOMMENDED): git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ Security check passed"
exit 0
'@

# Write the pre-commit hook
$PreCommitPath = Join-Path $GitHooksDir "pre-commit"
$PreCommitHook | Out-File -FilePath $PreCommitPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "[SUCCESS] Pre-commit hook installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "The hook will block commits containing:" -ForegroundColor Yellow
Write-Host "  - .env files (except .env.example, .env.template)"
Write-Host "  - API keys and credentials"
Write-Host "  - Service account JSON files"
Write-Host "  - .pem and .key files"
Write-Host ""
Write-Host "Your secrets are now protected!" -ForegroundColor Green
