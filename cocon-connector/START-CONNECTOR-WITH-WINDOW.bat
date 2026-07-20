@echo off
chcp 65001 >nul

REM Ждём 10 секунд после входа в Windows (чтобы всё загрузилось)
timeout /t 10 /nobreak >nul

REM Переходим в папку с connector
cd /d "%~dp0"

REM Запускаем connector в новом окне
start "HMAU Vote Connector" cmd /k "npm run dev"

REM Скрипт завершается, но окно connector остаётся открытым
