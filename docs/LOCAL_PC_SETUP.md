# Установка системы голосования на локальный Windows 11 ПК

## 📋 Контекст проекта

**Облачная версия:** https://rms-bot.com/hmau-vote/
**GitHub:** https://github.com/Korvova/hmau-vote

### Цель
Развернуть систему голосования на локальном ПК в организации для работы с Televic CoCon Room Server.

### Архитектура
```
Компьютер (1) - Windows 11 Pro:
├─ hmau-vote (веб-сайт + API на Node.js)
├─ PostgreSQL (база данных)
└─ CoCon Connector (Node.js приложение)
     ↓ Сетевое подключение
Компьютер (2) - Локальная сеть:
└─ Televic CoCon Room Server (http://10.0.20.32:8890/CoCon)
```

### Доступ
- **Локальная сеть:** http://10.0.20.142:5000/hmau-vote/
- **Из интернета:** http://meeting.organization.ru (настраивается администраторами)

---

## ✅ Что уже установлено

- ✅ Windows 11 Pro
- ✅ Node.js (уже установлен)
- ✅ OpenSSH Server (настроен)
- ✅ IP адрес: 10.0.20.142
- ✅ Пользователь: Владимир

---

## 📦 Что нужно установить

### 1. PostgreSQL 16
**Скачать:** https://www.postgresql.org/download/windows/

**При установке:**
- Порт: 5432 (по умолчанию)
- Пароль суперпользователя: запомнить!
- Создать базу данных: `voting`

### 2. Git for Windows
**Скачать:** https://git-scm.com/download/win

**При установке:**
- Все опции по умолчанию
- Выбрать "Use Git from Windows Command Prompt"

### 3. PM2 для Windows
```powershell
npm install -g pm2
npm install -g pm2-windows-service
```

---

## 🚀 Пошаговая установка

### Шаг 1: Установить PostgreSQL

1. Скачать PostgreSQL 16 Installer
2. Запустить установку
3. **Важно:** Запомнить пароль для пользователя `postgres`
4. Открыть pgAdmin или psql и создать базу:

```sql
CREATE DATABASE voting;
CREATE USER votingapp WITH PASSWORD 'votingapp_2025!';
GRANT ALL PRIVILEGES ON DATABASE voting TO votingapp;
```

---

### Шаг 2: Клонировать проект

Открыть PowerShell и выполнить:

```powershell
# Перейти в корень диска C
cd C:\

# Клонировать проект
git clone https://github.com/Korvova/hmau-vote.git voting-app

# Перейти в папку проекта
cd voting-app
```

---

### Шаг 3: Настроить .env файл

Создать файл `.env` в корне проекта:

```powershell
notepad .env
```

Содержимое файла:

```env
# Database connection
DATABASE_URL="postgresql://votingapp:votingapp_2025!@localhost:5432/voting?schema=public"

# Server port
PORT=5000

# Node environment
NODE_ENV=production
```

Сохранить файл (Ctrl+S) и закрыть блокнот.

---

### Шаг 4: Установить зависимости и настроить базу

```powershell
# Установить npm пакеты
npm install

# Сгенерировать Prisma Client
npx prisma generate

# Запустить миграции базы данных
npx prisma migrate deploy
```

---

### Шаг 5: Собрать фронтенд

```powershell
npm run build
```

Это создаст папку `dist/` со статическими файлами.

---

### Шаг 6: Запустить API через PM2

```powershell
# Запустить API
pm2 start api/server.cjs --name voting-api

# Сохранить конфигурацию
pm2 save

# Настроить автозапуск при включении ПК
pm2-startup install
pm2 save
```

---

### Шаг 7: Проверить что всё работает

Открыть браузер:
- http://localhost:5000/hmau-vote/ - должен открыться сайт
- http://localhost:5000/api/meetings - должен вернуть JSON

---

## 🔧 Настройка CoCon Connector

### Конфигурация Connector

В приложении CoCon Connector изменить настройки:

```
Site API base:   http://localhost:5000/api
Socket base:     http://localhost:5000
CoCon base:      http://10.0.20.32:8890/CoCon
Namespace:       /cocon-connector
Topic:           gost-duma-2025
```

**Важно:**
- `Site API base` теперь `localhost:5000` вместо `rms-bot.com`
- `CoCon base` - IP адрес компьютера (2) с Televic CoCon Server

---

## 🌐 Настройка доступа из интернета

### Для администраторов сети

#### 1. Проброс портов на роутере

Настроить Port Forwarding:

```
Внешний порт 80  → 10.0.20.142:5000
Внешний порт 443 → 10.0.20.142:5000
```

#### 2. DNS запись

Создать A-запись для домена:

```
meeting.organization.ru → Внешний IP организации
```

#### 3. SSL сертификат (опционально)

Установить Certbot для Let's Encrypt или использовать корпоративный сертификат.

---

## 🔍 Проверка работы системы

### Тесты локально

1. **База данных работает:**
   ```powershell
   npx prisma studio
   ```
   Откроется веб-интерфейс для просмотра данных.

2. **API отвечает:**
   ```powershell
   curl http://localhost:5000/api/meetings
   ```

3. **Фронтенд загружается:**
   Открыть http://localhost:5000/hmau-vote/ в браузере

4. **CoCon Connector подключен:**
   В интерфейсе Connector должно быть "Connected"

### Тесты из локальной сети

С другого компьютера в сети:
```
http://10.0.20.142:5000/hmau-vote/
```

---

## 📝 Полезные команды PM2

```powershell
# Посмотреть статус
pm2 status

# Посмотреть логи
pm2 logs voting-api

# Перезапустить API
pm2 restart voting-api

# Остановить API
pm2 stop voting-api

# Запустить API
pm2 start voting-api
```

---

## 🐛 Troubleshooting

### Проблема: "Cannot connect to database"

**Решение:**
1. Проверить что PostgreSQL запущен:
   ```powershell
   Get-Service postgresql*
   ```
2. Проверить DATABASE_URL в .env
3. Проверить что база `voting` создана

### Проблема: "Port 5000 already in use"

**Решение:**
1. Найти процесс на порту 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Убить процесс или изменить PORT в .env

### Проблема: CoCon Connector не подключается

**Решение:**
1. Проверить что API работает: http://localhost:5000/api/meetings
2. Проверить что CoCon доступен: http://10.0.20.32:8890/CoCon
3. Проверить настройки Connector (особенно Socket base)

### Проблема: Фронтенд не загружается

**Решение:**
1. Проверить что папка `dist/` существует
2. Пересобрать: `npm run build`
3. Перезапустить API: `pm2 restart voting-api`

---

## 📚 Важные особенности проекта

### Proxy Voting (Доверенности)
Система поддерживает голосование по доверенности:
- Пользователь может передать доверенность другому пользователю
- Голоса умножаются на количество доверенностей
- Пример: Пользователь 10 с 4 доверенностями голосует "За" = +5 голосов

### PDF Отчёты
- Детальные отчёты с поименными списками
- Показывают информацию о доверенностях
- Формат: "Пользователь (с доверенностями от: User1, User2)"

### Кворум
- Учитывает вес доверенностей при расчёте
- Формула: участники + количество доверенностей

---

## 🔄 При переезде на другой ПК

### Что изменить:

1. **IP адрес CoCon** в Connector (если изменился)
2. **DATABASE_URL** в .env (если база на другом ПК)
3. **Попросить админов** настроить проброс портов для нового IP

### Что НЕ меняется:

- Все файлы проекта
- Настройки PM2
- Структура базы данных (экспортировать/импортировать данные если нужно)

---

## 📞 Контакты

**GitHub проекта:** https://github.com/Korvova/hmau-vote
**Облачная версия:** https://rms-bot.com/hmau-vote/

---

## ✅ Чек-лист установки

- [ ] PostgreSQL установлен и запущен
- [ ] База данных `voting` создана
- [ ] Git установлен
- [ ] Проект клонирован в `C:\voting-app`
- [ ] Файл `.env` создан и настроен
- [ ] `npm install` выполнен
- [ ] `npx prisma migrate deploy` выполнен
- [ ] `npm run build` выполнен
- [ ] PM2 установлен (`npm install -g pm2`)
- [ ] API запущен через PM2
- [ ] Автозапуск настроен (`pm2-startup install`)
- [ ] Сайт открывается: http://localhost:5000/hmau-vote/
- [ ] API отвечает: http://localhost:5000/api/meetings
- [ ] CoCon Connector настроен и подключен
- [ ] Проверено с другого ПК в сети: http://10.0.20.142:5000/hmau-vote/
- [ ] Админы настроили проброс портов
- [ ] Домен работает: http://meeting.organization.ru

---

**Последнее обновление:** 2025-10-17
**Версия документа:** 1.0
