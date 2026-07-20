@echo off
chcp 65001 >nul
title HMAU Vote - CoCon Connector

echo.
echo ========================================
echo   HMAU Vote - CoCon Connector
echo   Auto Start
echo ========================================
echo.

REM Переходим в папку с connector
cd /d "%~dp0"

REM Проверяем есть ли Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Install Node.js first.
    pause
    exit /b 1
)

REM Проверяем есть ли package.json
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Run this script from connector directory.
    pause
    exit /b 1
)

echo Starting connector...
echo.

REM Запускаем connector
npm run dev

REM Если упал - ждём и перезапускаем
if %errorlevel% neq 0 (
    echo.
    echo Connector stopped with error.
    echo Restarting in 5 seconds...
    timeout /t 5 /nobreak
    goto :start
)
