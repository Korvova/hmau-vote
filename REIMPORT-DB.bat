@echo off
echo ========================================
echo   Re-importing Database with UTF-8
echo ========================================
echo.

echo Stopping containers...
docker compose down -v

echo.
echo Starting containers...
docker compose up -d

echo.
echo Waiting for database (15 seconds)...
timeout /t 15 /nobreak

echo.
echo Importing database with UTF-8...
docker cp init-db.sql voting-db:/tmp/init-db.sql
docker exec voting-db bash -c "export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && psql -U votingapp -d voting -f /tmp/init-db.sql"

echo.
echo Restarting app...
docker compose restart app

echo.
echo Done! Press any key to open browser...
pause
start http://localhost:8090/hmau-vote/
