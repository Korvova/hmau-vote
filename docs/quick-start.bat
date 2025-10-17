@echo off
REM ========================================
REM БЫСТРЫЙ ЗАПУСК СИСТЕМЫ ГОЛОСОВАНИЯ
REM ========================================
REM Этот скрипт запускает все компоненты системы

echo ========================================
echo  СИСТЕМА ГОЛОСОВАНИЯ - БЫСТРЫЙ ЗАПУСК
echo ========================================
echo.

REM Проверка что мы в корне проекта
if not exist "package.json" (
    echo [ОШИБКА] Запустите скрипт из корня проекта!
    echo Текущая папка: %CD%
    echo Должен быть файл package.json
    pause
    exit /b 1
)

echo [1/5] Проверка PostgreSQL...
sc query postgresql-x64-16 >nul 2>&1
if errorlevel 1 (
    echo [ПРЕДУПРЕЖДЕНИЕ] PostgreSQL не запущен или не установлен
    echo Запустите PostgreSQL вручную через Services
    pause
) else (
    echo [OK] PostgreSQL работает
)

echo.
echo [2/5] Проверка .env файла...
if not exist ".env" (
    echo [ПРЕДУПРЕЖДЕНИЕ] Файл .env не найден!
    echo Создайте .env файл по образцу docs/.env.local.example
    pause
) else (
    echo [OK] Файл .env существует
)

echo.
echo [3/5] Проверка зависимостей...
if not exist "node_modules" (
    echo [INFO] Устанавливаем зависимости...
    call npm install
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить зависимости
        pause
        exit /b 1
    )
) else (
    echo [OK] node_modules существует
)

echo.
echo [4/5] Проверка сборки фронтенда...
if not exist "dist" (
    echo [INFO] Собираем фронтенд...
    call npm run build
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось собрать фронтенд
        pause
        exit /b 1
    )
) else (
    echo [OK] dist/ существует
)

echo.
echo [5/5] Запуск API через PM2...
call pm2 describe voting-api >nul 2>&1
if errorlevel 1 (
    echo [INFO] Запускаем API первый раз...
    call pm2 start api/server.cjs --name voting-api
) else (
    echo [INFO] Перезапускаем API...
    call pm2 restart voting-api
)

if errorlevel 1 (
    echo [ОШИБКА] Не удалось запустить API
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ЗАПУСК ЗАВЕРШЕН!
echo ========================================
echo.
echo Сайт доступен по адресу:
echo   http://localhost:5000/hmau-vote/
echo.
echo API доступен по адресу:
echo   http://localhost:5000/api/meetings
echo.
echo Проверить статус: pm2 status
echo Посмотреть логи:  pm2 logs voting-api
echo Остановить:       pm2 stop voting-api
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
