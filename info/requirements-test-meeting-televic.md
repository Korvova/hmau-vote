# API для создания тестовых заседаний HMAU с интеграцией Televic

## Быстрый старт

### Создание 3-х типов тестовых заседаний с Televic

**1. Заседание "Не менее 2/3 от установленного числа депутатов" + Televic:**
```bash
curl -X POST https://rms-bot.com/api/test/create-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_FIXED"}'
```

**2. Заседание "2/3 от установленного" (кворум >1) + Televic:**
```bash
curl -X POST https://rms-bot.com/api/test/create-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_REGISTERED"}'
```

**3. Заседание "Половина +1" + Televic:**
```bash
curl -X POST https://rms-bot.com/api/test/create-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "HALF_PLUS_ONE"}'
```

### Удаление заседаний Televic

**Удалить по типу:**
```bash
# Удалить заседание "Не менее 2/3 от установленного числа депутатов"
curl -X DELETE https://rms-bot.com/api/test/delete-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_FIXED"}'

# Удалить заседание "2/3 от установленного"
curl -X DELETE https://rms-bot.com/api/test/delete-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_REGISTERED"}'

# Удалить заседание "Половина +1"
curl -X DELETE https://rms-bot.com/api/test/delete-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "HALF_PLUS_ONE"}'
```

**Удалить по ID:**
```bash
curl -X DELETE https://rms-bot.com/api/test/delete-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"id": 120}'
```

### Просмотр заседаний Televic

**Список всех тестовых заседаний Televic:**
```bash
curl https://rms-bot.com/api/test/list-meetings-televic | python3 -m json.tool
```

---

## Отличия от обычных заседаний

### ⭐ Главное отличие: галочка "Сайт + Televic"

Заседания, созданные через `/api/test/create-meeting-televic`, имеют:
- **`createInTelevic: true`** - галочка "Сайт + Televic" включена
- При запуске заседания автоматически создается заседание в Televic CoCon
- Голосования синхронизируются с Televic
- Участники могут голосовать через Televic пульты

### Сравнение с обычными заседаниями

| Параметр | Обычное заседание | Televic заседание |
|----------|-------------------|-------------------|
| Endpoint | `/api/test/create-meeting` | `/api/test/create-meeting-televic` |
| Название | "Десятое тест сайт ..." | "Десятое тест сайт **телевик** ..." |
| createInTelevic | `false` (по умолчанию) | `true` ✅ |
| Интеграция Televic | Нет | Да |
| televicMeetingId | `null` | Создается при старте |

---

## Детали создаваемых заседаний Televic

### 1. Заседание "Не менее 2/3 от установленного числа депутатов" + Televic

- **Название**: "Десятое тест сайт телевик (Не менее 2/3 от установленного числа депутатов)"
- **Процедура голосования**: ID 3 (2/3 от всех депутатов)
- **Кворум**: null
- **createInTelevic**: ✅ true (галочка "Сайт + Televic")
- **Группы**: "Тестовая группа 10" + "👥Приглашенные" (если существует)
- **Вопросы повестки**:
  - Вопрос 1 (докладчик: Иван 1)
  - Вопрос 2 (докладчик: Иван 2)
  - Вопрос 3 (докладчик: Иван 3)

### 2. Заседание "2/3 от установленного" + Televic

- **Название**: "Десятое тест сайт телевик 2/3 от установленного"
- **Процедура голосования**: ID 3 (2/3 от всех депутатов)
- **Кворум**: 2 (Больше 1)
- **createInTelevic**: ✅ true (галочка "Сайт + Televic")
- **Группы**: "Тестовая группа 10" + "👥Приглашенные" (если существует)
- **Вопросы повестки**: 3 вопроса с докладчиками "Иван 1", "Иван 2", "Иван 3"

### 3. Заседание "Половина +1" + Televic

- **Название**: "Десятое тест сайт телевик Половина +1"
- **Процедура голосования**: ID 4 (Большинство = 0.5)
- **Кворум**: null
- **createInTelevic**: ✅ true (галочка "Сайт + Televic")
- **Группы**: "Тестовая группа 10" + "👥Приглашенные" (если существует)
- **Вопросы повестки**: 3 вопроса с докладчиками "Иван 1", "Иван 2", "Иван 3"

---

## Требования перед использованием

**⚠️ Важно**: Перед созданием заседаний необходимо создать тестовых пользователей!

```bash
# 1. Создать 38 тестовых пользователей (ID 10-47) в группе "Тестовая группа 10"
curl -X POST https://rms-bot.com/api/test/create-users \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. (Опционально) Создать 5 гостевых пользователей (G1-G5) в группе "👥Приглашенные"
curl -X POST https://rms-bot.com/api/test/create-guests \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Теперь можно создавать заседания с Televic
curl -X POST https://rms-bot.com/api/test/create-meeting-televic \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_FIXED"}'
```

---

## Пример ответа при создании заседания Televic

```json
{
  "success": true,
  "message": "Created Televic test meeting: Десятое тест сайт телевик (Не менее 2/3 от установленного числа депутатов)",
  "meeting": {
    "id": 120,
    "name": "Десятое тест сайт телевик (Не менее 2/3 от установленного числа депутатов)",
    "startTime": "2025-10-16T15:57:27.789Z",
    "endTime": "2025-10-16T19:57:27.789Z",
    "status": "WAITING",
    "voteProcedureId": 3,
    "quorumType": null,
    "createInTelevic": true,
    "divisions": [
      {
        "id": 39,
        "name": "Тестовая группа 10"
      }
    ]
  },
  "agendaItems": [
    {
      "id": 301,
      "number": 1,
      "title": "Вопрос 1",
      "speakerName": "Иван 1"
    },
    {
      "id": 302,
      "number": 2,
      "title": "Вопрос 2",
      "speakerName": "Иван 2"
    },
    {
      "id": 303,
      "number": 3,
      "title": "Вопрос 3",
      "speakerName": "Иван 3"
    }
  ]
}
```

**Обратите внимание на**: `"createInTelevic": true` ✅

---

## Технические детали

### Процедуры голосования

| ID | Название | Условие |
|----|----------|---------|
| 3  | Не менее 2/3 от установленного | За > Все пользователи * 0.6667 И За > Против |
| 4  | Большинство от установленного | За > Все пользователи * 0.5 И За > Против |

### API Endpoints

- **POST /api/test/create-meeting-televic** - Создать тестовое заседание с Televic
- **DELETE /api/test/delete-meeting-televic** - Удалить тестовое заседание Televic
- **GET /api/test/list-meetings-televic** - Список всех тестовых заседаний Televic

### Параметры create-meeting-televic

| Параметр | Тип | Значения | Описание |
|----------|-----|----------|----------|
| type | string | TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, HALF_PLUS_ONE | Тип кворума заседания |

### Параметры delete-meeting-televic

| Параметр | Тип | Описание |
|----------|-----|----------|
| type | string | Тип заседания (TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, HALF_PLUS_ONE) |
| id | number | ID заседания для удаления |

**Примечание**: Можно указать либо `type`, либо `id`.

---

## Что происходит при запуске заседания Televic

Когда заседание с `createInTelevic: true` запускается:

1. **Автоматически создается заседание в Televic CoCon**
   - Название заседания передается в Televic
   - Участники синхронизируются с Televic
   - Присваивается `televicMeetingId`

2. **Голосования синхронизируются**
   - При создании голосования на сайте, оно создается в Televic
   - Голоса с Televic пультов отображаются на сайте
   - Голоса с сайта передаются в Televic

3. **Результаты агрегируются**
   - Голоса с сайта + Televic объединяются
   - Итоговый результат учитывает оба источника

---

## Проверка интеграции Televic

После создания заседания можно проверить статус интеграции:

```bash
# Получить список заседаний Televic
curl https://rms-bot.com/api/test/list-meetings-televic | python3 -m json.tool

# Проверить, что createInTelevic: true
# После запуска заседания проверить, что televicMeetingId != null
```

---

## Сравнение всех типов заседаний

### Типы API endpoints

1. **Обычные заседания** (без Televic)
   - Endpoint: `/api/test/create-meeting`
   - Название: "Десятое тест сайт ..."
   - createInTelevic: `false`

2. **Заседания с Televic** (с интеграцией)
   - Endpoint: `/api/test/create-meeting-televic`
   - Название: "Десятое тест сайт **телевик** ..."
   - createInTelevic: `true` ✅

### Когда использовать какой тип

- **Обычные заседания**: Тестирование логики сайта без Televic
- **Televic заседания**: Тестирование интеграции с Televic CoCon

---

*Последнее обновление: 2025-10-16*
