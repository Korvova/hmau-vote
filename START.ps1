# HMAU Vote - Auto Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HMAU Vote - Auto Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker not installed!" -ForegroundColor Red
    Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    pause
    exit 1
}

# Check Docker is running
try {
    docker ps | Out-Null
    Write-Host "   Docker is running!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running! Start Docker Desktop." -ForegroundColor Red
    pause
    exit 1
}

# Check if Docker image exists, load if needed
Write-Host ""
Write-Host "[2/5] Checking Docker image..." -ForegroundColor Yellow
$imageExists = docker images voting-app:latest -q
if (-not $imageExists) {
    Write-Host "   Docker image not found. Loading from file..." -ForegroundColor Yellow
    Write-Host "   This will take 30-60 seconds..." -ForegroundColor Yellow

    if (-not (Test-Path "voting-app-image.tar.gz")) {
        Write-Host "ERROR: voting-app-image.tar.gz not found!" -ForegroundColor Red
        Write-Host "Building image instead (will take 3-5 minutes)..." -ForegroundColor Yellow
        docker compose build
    } else {
        docker load -i voting-app-image.tar.gz
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Docker image loaded successfully!" -ForegroundColor Green
        } else {
            Write-Host "ERROR loading Docker image!" -ForegroundColor Red
            pause
            exit 1
        }
    }
} else {
    Write-Host "   Docker image found!" -ForegroundColor Green
}

# Stop old containers
Write-Host ""
Write-Host "[3/5] Stopping old containers..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null

# Start containers
Write-Host ""
Write-Host "[4/5] Starting containers..." -ForegroundColor Yellow
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR starting containers!" -ForegroundColor Red
    pause
    exit 1
}

# Wait for database
Write-Host ""
Write-Host "[5/5] Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Import database
Write-Host ""
Write-Host "Importing database with UTF-8..." -ForegroundColor Yellow

# Copy SQL file to container
docker cp init-db.sql voting-db:/tmp/init-db.sql

# Import inside container with proper encoding
docker exec voting-db bash -c "export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && psql -U votingapp -d voting -f /tmp/init-db.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Database imported successfully!" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Database import failed!" -ForegroundColor Red
    Write-Host "   Check the error above." -ForegroundColor Red
}

# Restart app
Write-Host ""
Write-Host "Restarting application..." -ForegroundColor Yellow
docker compose restart app | Out-Null
Start-Sleep -Seconds 5

# Check status
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Container status:" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "Application available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:8090/hmau-vote/" -ForegroundColor Yellow
Write-Host ""
Write-Host "API available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:5001/api/health" -ForegroundColor Yellow
Write-Host ""

# Open browser
Write-Host "Opening browser..." -ForegroundColor Green
Start-Sleep -Seconds 2
Start-Process "http://localhost:8090/hmau-vote/"

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
pause
