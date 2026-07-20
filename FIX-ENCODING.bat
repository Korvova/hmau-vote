@echo off
echo ========================================
echo   Fixing UTF-8 Encoding
echo ========================================
echo.

echo Restarting nginx with updated config...
docker compose restart nginx

echo.
echo Waiting for nginx to start...
timeout /t 3 /nobreak

echo.
echo Done! Press any key to open browser...
pause
start http://localhost:8090/hmau-vote/meetings
