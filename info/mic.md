# Управление микрофонами Televic через Web-интерфейс

## Описание проблемы

Ранее микрофоны не включались при клике на кнопку в веб-интерфейсе. Устройства Televic не загорались красным светом, хотя API возвращал успешный ответ.

## Причина проблемы

Использовались **неправильные API endpoints** для управления микрофонами CoCon:
- ❌ **Неправильно**: `/Microphone/SetMicrophoneOn` и `/Microphone/SetMicrophoneOff`
- ✅ **Правильно**: `/Microphone/SetState?State=On&SeatNr=X` и `/Microphone/SetState?State=Off&SeatNr=X`

## Архитектура системы

```
Браузер (Frontend)
    ↓ HTTP POST /api/televic/microphone/toggle
Cloud Server (Node.js API)
    ↓ Socket.IO (server:command:exec)
Windows PC (Connector)
    ↓ HTTP GET /CoCon/Microphone/SetState?State=On&SeatNr=X
Televic CoCon Server
    ↓ Serial/Network Protocol
Televic Hardware (Microphone Unit)
    → 🔴 RED LED загорается
```

## Как работает управление микрофоном

### 1. Frontend отправляет запрос

**Файл**: `src/pages/ControlMeetingPage.jsx` (строки 48-74)

```javascript
const handleMicrophoneToggle = async (user) => {
  if (!user.televicExternalId) {
    alert('Пользователь не связан с Televic делегатом');
    return;
  }

  try {
    const newMutedState = !user.muted;
    const action = newMutedState ? 'disable' : 'enable';

    await axios.post('/api/televic/microphone/toggle', {
      userId: user.id,
      action
    });

    // Обновить локальное состояние
    setUsers((prev) => prev.map((u) =>
      u.id === user.id ? { ...u, muted: newMutedState } : u
    ));
  } catch (error) {
    console.error('Failed to toggle microphone:', error);
    alert('Не удалось переключить микрофон: ' + (error.response?.data?.error || error.message));
  }
};
```

**Параметры запроса**:
- `userId` - ID пользователя в базе данных
- `action` - `'enable'` или `'disable'`

### 2. Backend обрабатывает запрос

**Файл**: `api/root/televic.cjs` (строки 53-226)

#### Шаг 1: Валидация
```javascript
const { userId, action } = req.body;
if (!userId) {
  return res.status(400).json({ error: 'userId required' });
}
if (!action || !['enable', 'disable'].includes(action)) {
  return res.status(400).json({ error: 'action must be "enable" or "disable"' });
}
```

#### Шаг 2: Поиск пользователя и televicExternalId
```javascript
const user = await prisma.user.findUnique({
  where: { id: Number(userId) },
  select: { televicExternalId: true, name: true }
});

if (!user?.televicExternalId) {
  return res.status(400).json({ error: 'User not linked to Televic delegate' });
}
```

**Важно**: `televicExternalId` - это ID делегата в системе CoCon (например, "9", "10")

#### Шаг 3: Поиск активного заседания
```javascript
// Отправка команды через Socket.IO коннектор
socket.emit('server:command:exec', {
  id: commandId,
  type: 'ConnectorHttp',
  payload: {
    method: 'GET',
    url: '/Meeting_Agenda/GetAllMeetings'
  }
});

// Парсинг ответа
const meetings = parsed?.GetAllMeetings?.Meetings || [];
const runningMeeting = meetings.find(m => String(m.State).toLowerCase() === 'running');

if (!runningMeeting) {
  return res.status(400).json({ error: 'No running meeting in CoCon' });
}
```

**Важно**: Микрофоны можно управлять только во время активного (Running) заседания!

#### Шаг 4: Получение расположения делегатов (Seating)
```javascript
socket.emit('server:command:exec', {
  id: seatingId,
  type: 'ConnectorHttp',
  payload: {
    method: 'GET',
    url: `/Meeting_Agenda/GetDelegateSeating`,
    query: { MeetingId: runningMeeting.Id }
  }
});

// Поиск места делегата
const seats = seatingParsed?.GetDelegateSeating?.DelegateSeating || [];
const delegateSeat = seats.find(d => String(d.DelegateId) === String(user.televicExternalId));

if (!delegateSeat) {
  return res.status(400).json({ error: 'Delegate not in seating for this meeting' });
}
```

**Важно**:
- `DelegateId` - ID делегата в CoCon (совпадает с `televicExternalId`)
- `SeatId` - номер физического места/устройства (например, 3, 4)

#### Шаг 5: Переключение микрофона (КЛЮЧЕВОЕ!)

```javascript
// ✅ ПРАВИЛЬНЫЙ СПОСОБ
const state = action === 'enable' ? 'On' : 'Off';

socket.emit('server:command:exec', {
  id: micId,
  type: 'ConnectorHttp',
  payload: {
    method: 'GET',
    url: '/Microphone/SetState',
    query: { State: state, SeatNr: delegateSeat.SeatId }
  }
});
```

**⚠️ ВАЖНО**: Используйте именно этот endpoint!

❌ **НЕ ИСПОЛЬЗУЙТЕ**:
```javascript
// НЕПРАВИЛЬНО - эти endpoints не работают!
url: `/Microphone/SetMicrophoneOn`
url: `/Microphone/SetMicrophoneOff`
```

## Структура данных

### User (База данных)
```javascript
{
  id: 5,                          // ID в нашей БД
  name: "Пётр Петрович",
  email: "3@3.ru",
  televicExternalId: "10",        // ID делегата в CoCon
  isBadgeInserted: true           // Вставлена ли RFID карта
}
```

### Meeting в CoCon
```javascript
{
  Id: 118,
  Title: "Кто у нас не первый тот у нас второй",
  State: "Running",               // Должен быть "Running"!
  StartTime: "2025/10/14 09:22:40",
  EndTime: ""
}
```

### Delegate Seating
```javascript
{
  DelegateId: 10,                 // = user.televicExternalId
  SeatId: 4                       // Номер физического устройства
}
```

## Проверка работы микрофона

### 1. Через curl (прямой API)
```bash
# Включить микрофон
curl -X POST https://rms-bot.com/api/televic/microphone/toggle \
  -H "Content-Type: application/json" \
  -d '{"userId": 5, "action": "enable"}'

# Ожидаемый ответ:
{"ok":true,"action":"enable","user":"третий","seatId":4}

# Выключить микрофон
curl -X POST https://rms-bot.com/api/televic/microphone/toggle \
  -H "Content-Type: application/json" \
  -d '{"userId": 5, "action": "disable"}'
```

### 2. Через Browser Console (в DevTools)
```javascript
// Включить микрофон для пользователя с ID 5
axios.post('/api/televic/microphone/toggle', {
  userId: 5,
  action: 'enable'
}).then(r => console.log(r.data));

// Выключить
axios.post('/api/televic/microphone/toggle', {
  userId: 5,
  action: 'disable'
}).then(r => console.log(r.data));
```

### 3. Проверка логов сервера
```bash
# Просмотр логов в реальном времени
pm2 logs voting-api --lines 50

# Поиск записей о микрофоне
pm2 logs voting-api --lines 100 --nostream | grep "Microphone Toggle"
```

**Успешные логи выглядят так**:
```
[Microphone Toggle] Request body: { userId: 5, action: 'enable' }
[Microphone Toggle] userId: 5 action: enable
[Microphone Toggle] User found: третий televicExternalId: 10
[Microphone Toggle] Running meeting found: 118 Кто у нас не первый тот у нас второй
[Microphone Toggle] Delegate seat found: 4
[Microphone Toggle] SUCCESS: Microphone toggled enable for user третий
```

## Возможные ошибки и решения

### 1. "userId required"
**Причина**: Не передан параметр `userId`
**Решение**: Проверьте, что в запросе есть `{"userId": X}`

### 2. "User not linked to Televic delegate"
**Причина**: У пользователя не установлен `televicExternalId`
**Решение**:
- Откройте страницу пользователей
- Привяжите пользователя к делегату Televic
- Проверьте в БД: `SELECT id, name, televicExternalId FROM "User" WHERE id = 5;`

### 3. "No running meeting in CoCon"
**Причина**: Нет активного заседания со статусом "Running"
**Решение**:
- Откройте CoCon и запустите заседание (Start Meeting)
- Проверьте статус через API: `GET /api/televic/meetings`

### 4. "Delegate not in seating for this meeting"
**Причина**: Делегат не включен в рассадку текущего заседания
**Решение**:
- Откройте CoCon → Meeting Agenda → Seating
- Добавьте делегата в рассадку
- Проверьте через API: `GET /api/televic/seating`

### 5. "No connector online"
**Причина**: Windows коннектор не подключен к серверу
**Решение**:
- Проверьте, работает ли коннектор на Windows PC
- Проверьте Socket.IO подключение в логах:
  ```bash
  pm2 logs voting-api | grep "cocon.*connection"
  ```
- Ожидаемый лог: `[cocon] connection XXXXX { connectorId: 'conn-9dd67b8b', ... }`

## Отладка

### Проверка коннектора
```bash
# Проверить, подключен ли коннектор
pm2 logs voting-api --lines 20 | grep "cocon.*connection"

# Ожидаемый результат:
# [cocon] connection O9D22ApVRZRf1tsOAAAB { connectorId: 'conn-9dd67b8b', topic: 'gost-duma-2025', roomId: 1 }
```

### Проверка состояния микрофона в CoCon
```bash
# Через тестовый endpoint (если создан)
curl -X POST http://localhost:5000/api/televic/test-cocon \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","url":"/Microphone/GetState","query":{}}' | python3 -m json.tool

# Ожидаемый результат:
{
    "ok": true,
    "data": {
        "status": 200,
        "data": "{\"GetState\":{\"State\":{\"Speakers\":[4,3],\"Requests\":[],\"Replies\":[]}}}"
    }
}
```

**Расшифровка**:
- `"Speakers":[4,3]` - микрофоны на местах 4 и 3 включены (🔴 горят красным)
- `"Requests":[]` - нет запросов на слово
- `"Replies":[]` - нет ответов

### Мониторинг Socket.IO событий
```bash
# Отслеживание команд в реальном времени
pm2 logs voting-api --lines 0 | grep "cocon"

# Вы увидите:
# [cocon] ack - подтверждение получения команды коннектором
# [cocon] result - результат выполнения команды
```

## Документация CoCon API

**Файл**: `/var/www/Out-app-cocon-node/API Document for 6.10.pdf`

**Ключевые разделы**:
- **4.3.3 Microphone** (стр. 89) - API управления микрофонами
- **4.3.3.6 GetState** (стр. 92) - получение состояния микрофонов
- **SetState** - установка состояния микрофона (State=On/Off, SeatNr=X)

**Пример из документации**:
```
http://localhost:8890/CoCon/Microphone/SetState/?State=On&SeatNr=9
```

## Перезапуск после изменений

После изменения кода в `api/root/televic.cjs`:

```bash
# 1. Перезапустить API
pm2 restart voting-api

# 2. Пересобрать frontend (если изменяли React код)
cd /var/www/hmau-vote
npm run build

# 3. Проверить логи
pm2 logs voting-api --lines 20
```

## История изменений

**Дата**: 14 октября 2025
**Проблема**: Микрофоны не включались при клике в веб-интерфейсе
**Решение**: Заменили API endpoint с `SetMicrophoneOn/Off` на `SetState?State=On/Off&SeatNr=X`
**Файл**: `api/root/televic.cjs` (строки 180-208)

**До**:
```javascript
const micAction = action === 'enable' ? 'SetMicrophoneOn' : 'SetMicrophoneOff';
socket.emit('server:command:exec', {
  payload: {
    method: 'GET',
    url: `/Microphone/${micAction}`,
    query: { SeatId: delegateSeat.SeatId }
  }
});
```

**После**:
```javascript
const state = action === 'enable' ? 'On' : 'Off';
socket.emit('server:command:exec', {
  payload: {
    method: 'GET',
    url: '/Microphone/SetState',
    query: { State: state, SeatNr: delegateSeat.SeatId }
  }
});
```

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи сервера: `pm2 logs voting-api`
2. Проверьте подключение коннектора
3. Проверьте статус заседания в CoCon
4. Прочитайте этот документ еще раз внимательно 😊

---

**Создано**: 14.10.2025
**Последнее обновление**: 14.10.2025
**Автор**: Claude AI + Разработчик
