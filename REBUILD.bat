@echo off
echo ========================================
echo   Rebuilding Docker image with changes
echo ========================================
echo.

echo Stopping containers...
docker compose down

echo.
echo Building new image (this may take 2-3 minutes)...
docker compose build app

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Starting containers with new image...
docker compose up -d

echo.
echo Waiting for application to start...
timeout /t 10 /nobreak

echo.
echo ========================================
echo   DONE! Image rebuilt and started.
echo ========================================
echo.
echo Application: http://localhost:8090/hmau-vote/
echo.

pause
