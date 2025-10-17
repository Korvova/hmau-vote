# 🐳 Развертывание проекта через Docker

Это самый простой способ запустить проект на локальном компьютере.

---

## 📋 Что нужно

1. **Docker Desktop** - скачать с https://www.docker.com/products/docker-desktop/
2. **Git** - для обновления кода
3. **Windows 10/11** - с включенной виртуализацией

---

## 🚀 Быстрый старт (3 команды)

### Шаг 1: Обновить код из репозитория

```powershell
cd C:\Users\Владимир\Documents\App\hmau-vote
git pull origin main
```

### Шаг 2: Запустить Docker контейнеры

```powershell
docker-compose up -d
```

Эта команда:
- Создаст PostgreSQL базу данных
- Импортирует все данные из облака
- Запустит API сервер
- Настроит Nginx для раздачи фронтенда

### Шаг 3: Открыть сайт

Открой браузер и перейди на:
```
http://localhost/hmau-vote/
```

---

## 🔧 Настройка CoCon Connector

После запуска Docker, настрой CoCon Connector:

1. Открой CoCon Connector
2. **Site API base**: `http://localhost/api`
3. **Socket base**: `http://localhost`
4. **CoCon base**: `http://10.0.20.32:8890/CoCon` (не меняй)

---

## 📊 Управление контейнерами

### Просмотр логов
```powershell
docker-compose logs -f app
```

### Перезапуск контейнеров
```powershell
docker-compose restart
```

### Остановка контейнеров
```powershell
docker-compose down
```

### Полная пересборка (если что-то изменилось в коде)
```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🗄️ Работа с базой данных

### Подключиться к PostgreSQL
```powershell
docker exec -it voting-db psql -U votingapp -d voting
```

### Экспортировать базу данных
```powershell
docker exec voting-db pg_dump -U votingapp voting > backup.sql
```

### Импортировать базу данных
```powershell
docker exec -i voting-db psql -U votingapp voting < backup.sql
```

---

## 🔄 Обновление проекта

Когда выходит новая версия:

```powershell
cd C:\Users\Владимир\Documents\App\hmau-vote
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🆘 Решение проблем

### Проблема: Docker не запускается

**Решение:** Убедись что:
1. Docker Desktop запущен (иконка в трее)
2. Виртуализация включена в BIOS
3. WSL 2 установлен (Docker Desktop попросит установить)

### Проблема: Порт 80 занят

**Решение:** Измени порт в `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # Вместо "80:80"
```

Тогда сайт будет на `http://localhost:8080/hmau-vote/`

### Проблема: База данных не импортировалась

**Решение:** Пересоздай контейнеры:
```powershell
docker-compose down -v  # Удалит volumes (базу данных)
docker-compose up -d    # Создаст заново и импортирует данные
```

### Проблема: Изменения в коде не применяются

**Решение:** Пересобери образ:
```powershell
docker-compose build --no-cache app
docker-compose up -d
```

---

## 📁 Структура проекта

```
hmau-vote/
├── docker-compose.yml      # Конфигурация всех сервисов
├── Dockerfile              # Сборка приложения
├── nginx.conf              # Настройки веб-сервера
├── init-db.sql             # Начальные данные для базы
├── .env.docker.example     # Пример переменных окружения
└── uploads/                # Загруженные файлы (логотипы и т.д.)
```

---

## ✅ Проверка работы

После запуска проверь:

1. **API работает**: http://localhost/api/health
2. **Фронтенд доступен**: http://localhost/hmau-vote/
3. **База данных**:
   ```powershell
   docker exec voting-db psql -U votingapp -d voting -c "SELECT COUNT(*) FROM \"User\";"
   ```
4. **Логи без ошибок**:
   ```powershell
   docker-compose logs app
   ```

---

## 🎯 Что дальше?

После успешного запуска:
1. Войди в систему с существующим аккаунтом
2. Проверь что все собрания и пользователи на месте
3. Настрой CoCon Connector
4. Протестируй голосование
5. Попроси админов настроить порт-форвардинг для доступа извне

---

## 💡 Советы

- Docker контейнеры автоматически запустятся при перезагрузке ПК
- Все данные сохраняются в Docker volumes (не потеряются при перезапуске)
- Папка `uploads/` монтируется напрямую из проекта (логотипы доступны без пересборки)
- Логи доступны через `docker-compose logs`

---

**Нужна помощь?** Создай issue на GitHub или напиши в поддержку.
