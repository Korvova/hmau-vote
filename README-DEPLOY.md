# 🚀 Инструкция по развертыванию hmau-vote на Windows Server

## ✅ Что готово

Проект полностью настроен и протестирован на Linux-сервере. Готов к переносу на Windows.

**Статус контейнеров на текущем сервере:**
- ✅ voting-db (PostgreSQL) - работает на порту 5433
- ✅ voting-app (Node.js API) - работает на порту 5001
- ✅ voting-nginx - работает на порту 8090

**Доступ:**
- Локально: http://localhost:8090/hmau-vote/
- Через nginx: http://kc.test-rms.ru/ (требует настройки DNS)

---

## 📦 Что нужно скопировать на Windows

Скопируйте всю папку `/var/www/docker-hmau-vote/` на Windows сервер.

**Важные файлы:**
- `docker-compose.yml` - конфигурация контейнеров
- `Dockerfile` - сборка приложения (Node 20)
- `init-db.sql` - начальная схема базы данных
- `nginx.conf` - конфигурация веб-сервера
- `dist/` - собранный фронтенд
- `api/` - backend код
- `uploads/` - загруженные файлы

---

## 🪟 Установка на Windows Server

### Шаг 1: Установить Docker Desktop

1. Скачать: https://www.docker.com/products/docker-desktop/
2. Установить и запустить
3. Убедиться что WSL 2 включен
4. Включить виртуализацию в BIOS если требуется

### Шаг 2: Скопировать проект

Скопируйте папку `docker-hmau-vote` на Windows, например:
```
C:\docker-hmau-vote\
```

### Шаг 3: Запустить проект

Откройте PowerShell в папке проекта и выполните:

```powershell
cd C:\docker-hmau-vote

# Запустить контейнеры
docker compose up -d

# Проверить статус
docker compose ps

# Импортировать базу данных (если нужно)
docker exec -i voting-db psql -U votingapp -d voting < init-db.sql

# Посмотреть логи
docker compose logs -f
```

### Шаг 4: Проверить работу

Откройте браузер:
- Фронтенд: http://localhost:8090/hmau-vote/
- API: http://localhost:5001/api/health

---

## ⚙️ Используемые порты

**По умолчанию (как на Linux):**
- 8090 → nginx (веб-интерфейс)
- 5001 → Node.js API
- 5433 → PostgreSQL

**Если нужно изменить:**
Отредактируйте `docker-compose.yml`:
```yaml
ports:
  - "8090:80"  # Измените 8090 на нужный порт
```

---

## 🌐 Настройка внешнего доступа

### Вариант 1: Через порт (проще)

Откройте порт 8090 в Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "HMAU Vote" -Direction Inbound -LocalPort 8090 -Protocol TCP -Action Allow
```

Доступ: http://IP-АДРЕС:8090/hmau-vote/

### Вариант 2: Через IIS или nginx (рекомендуется)

Установите nginx для Windows или IIS и настройте reverse proxy на localhost:8090.

Пример конфигурации nginx для Windows (`nginx.conf`):
```nginx
server {
    listen 80;
    server_name kc.test-rms.ru;

    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔄 Обновление проекта

Когда выйдет новая версия:

```powershell
# Остановить контейнеры
docker compose down

# Скопировать новые файлы (заменить старые)
# Или сделать git pull если используете git

# Пересобрать и запустить
docker compose build --no-cache
docker compose up -d
```

---

## 🛠 Управление контейнерами

### Основные команды

```powershell
# Запустить
docker compose up -d

# Остановить
docker compose down

# Перезапустить
docker compose restart

# Посмотреть логи
docker compose logs -f app

# Посмотреть статус
docker compose ps

# Зайти внутрь контейнера
docker exec -it voting-app sh
```

### Работа с базой данных

```powershell
# Подключиться к PostgreSQL
docker exec -it voting-db psql -U votingapp -d voting

# Экспортировать базу
docker exec voting-db pg_dump -U votingapp voting > backup.sql

# Импортировать базу
docker exec -i voting-db psql -U votingapp voting < backup.sql

# Посмотреть таблицы
docker exec voting-db psql -U votingapp -d voting -c "\dt"
```

---

## 🆘 Решение проблем

### Проблема: Docker не запускается на Windows

**Решение:**
1. Включить виртуализацию в BIOS (Intel VT-x / AMD-V)
2. Включить WSL 2:
   ```powershell
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```
3. Перезагрузить компьютер
4. Установить Docker Desktop

### Проблема: Порт занят

**Решение:** Измените порты в `docker-compose.yml`:
```yaml
ports:
  - "8091:80"  # Вместо 8090
  - "5002:5000"  # Вместо 5001
```

### Проблема: База данных пустая

**Решение:**
```powershell
docker exec -i voting-db psql -U votingapp -d voting < init-db.sql
docker compose restart app
```

### Проблема: Контейнер падает

**Решение:** Посмотрите логи:
```powershell
docker compose logs app
docker compose logs postgres
```

---

## 📊 Технические характеристики

- **Node.js**: 20-alpine
- **PostgreSQL**: 16-alpine
- **Nginx**: alpine
- **Архитектура**: Multi-stage Docker build
- **Хранилище**: Docker volumes для БД, bind mount для uploads

---

## 🔐 Безопасность

**Пароль БД по умолчанию:** `votingapp_2025!`

⚠️ **Важно:** Измените пароль в `docker-compose.yml` перед публикацией:

```yaml
environment:
  POSTGRES_PASSWORD: ваш_безопасный_пароль_здесь
  DATABASE_URL: "postgresql://votingapp:ваш_безопасный_пароль_здесь@postgres:5432/voting?schema=public"
```

---

## ✅ Контрольный список развертывания

- [ ] Docker Desktop установлен и запущен
- [ ] Проект скопирован на Windows
- [ ] `docker compose up -d` выполнено без ошибок
- [ ] База данных импортирована (init-db.sql)
- [ ] Приложение доступно на http://localhost:8090/hmau-vote/
- [ ] API отвечает на http://localhost:5001/api/health
- [ ] Firewall настроен (если нужен внешний доступ)
- [ ] Пароль БД изменен (для production)

---

## 📞 Поддержка

При возникновении проблем проверьте логи:
```powershell
docker compose logs --tail=100
```

---

**Проект готов к развертыванию!** 🚀
