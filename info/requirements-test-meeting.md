# API для создания тестовых заседаний HMAU

## Быстрый старт

### Создание 3-х типов тестовых заседаний

**1. Заседание "Не менее 2/3 от установленного числа депутатов":**
```bash
curl -X POST https://rms-bot.com/api/test/create-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_FIXED"}'
```

**2. Заседание "2/3 от установленного" (кворум >1):**
```bash
curl -X POST https://rms-bot.com/api/test/create-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_REGISTERED"}'
```

**3. Заседание "Половина +1":**
```bash
curl -X POST https://rms-bot.com/api/test/create-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "HALF_PLUS_ONE"}'
```

### Удаление заседаний

**Удалить по типу:**
```bash
# Удалить заседание "Не менее 2/3 от установленного числа депутатов"
curl -X DELETE https://rms-bot.com/api/test/delete-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_FIXED"}'

# Удалить заседание "2/3 от установленного"
curl -X DELETE https://rms-bot.com/api/test/delete-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_REGISTERED"}'

# Удалить заседание "Половина +1"
curl -X DELETE https://rms-bot.com/api/test/delete-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "HALF_PLUS_ONE"}'
```

**Удалить по ID:**
```bash
curl -X DELETE https://rms-bot.com/api/test/delete-meeting \
  -H "Content-Type: application/json" \
  -d '{"id": 119}'
```

### Просмотр заседаний

**Список всех тестовых заседаний:**
```bash
curl https://rms-bot.com/api/test/list-meetings | python3 -m json.tool
```

---

## Детали создаваемых заседаний

### 1. Заседание "Не менее 2/3 от установленного числа депутатов"

- **Название**: "Десятое тест сайт (Не менее 2/3 от установленного числа депутатов)"
- **Процедура голосования**: ID 3 (2/3 от всех депутатов)
- **Кворум**: null
- **Группы**: "Тестовая группа 10" + "👥Приглашенные" (если существует)
- **Вопросы повестки**:
  - Вопрос 1 (докладчик: Иван 1)
  - Вопрос 2 (докладчик: Иван 2)
  - Вопрос 3 (докладчик: Иван 3)

### 2. Заседание "2/3 от установленного"

- **Название**: "Десятое тест сайт 2/3 от установленного"
- **Процедура голосования**: ID 3 (2/3 от всех депутатов)
- **Кворум**: 2 (Больше 1)
- **Группы**: "Тестовая группа 10" + "👥Приглашенные" (если существует)
- **Вопросы повестки**: 3 вопроса с докладчиками "Иван 1", "Иван 2", "Иван 3"

### 3. Заседание "Половина +1"

- **Название**: "Десятое тест сайт Половина +1"
- **Процедура голосования**: ID 4 (Большинство = 0.5)
- **Кворум**: null
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

# 3. Теперь можно создавать заседания
curl -X POST https://rms-bot.com/api/test/create-meeting \
  -H "Content-Type: application/json" \
  -d '{"type": "TWO_THIRDS_FIXED"}'
```

---

## Пример ответа при создании заседания

```json
{
  "success": true,
  "message": "Created test meeting: Десятое тест сайт (Не менее 2/3 от установленного числа депутатов)",
  "meeting": {
    "id": 119,
    "name": "Десятое тест сайт (Не менее 2/3 от установленного числа депутатов)",
    "startTime": "2025-10-16T15:54:30.371Z",
    "endTime": "2025-10-16T19:54:30.371Z",
    "status": "WAITING",
    "voteProcedureId": 3,
    "quorumType": null,
    "divisions": [
      {
        "id": 39,
        "name": "Тестовая группа 10"
      }
    ]
  },
  "agendaItems": [
    {
      "id": 298,
      "number": 1,
      "title": "Вопрос 1",
      "speakerName": "Иван 1"
    },
    {
      "id": 299,
      "number": 2,
      "title": "Вопрос 2",
      "speakerName": "Иван 2"
    },
    {
      "id": 300,
      "number": 3,
      "title": "Вопрос 3",
      "speakerName": "Иван 3"
    }
  ]
}
```

---

## Технические детали

### Процедуры голосования

| ID | Название | Условие |
|----|----------|---------|
| 3  | Не менее 2/3 от установленного | За > Все пользователи * 0.6667 И За > Против |
| 4  | Большинство от установленного | За > Все пользователи * 0.5 И За > Против |

### API Endpoints

- **POST /api/test/create-meeting** - Создать тестовое заседание
- **DELETE /api/test/delete-meeting** - Удалить тестовое заседание
- **GET /api/test/list-meetings** - Список всех тестовых заседаний

### Параметры create-meeting

| Параметр | Тип | Значения | Описание |
|----------|-----|----------|----------|
| type | string | TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, HALF_PLUS_ONE | Тип кворума заседания |

### Параметры delete-meeting

| Параметр | Тип | Описание |
|----------|-----|----------|
| type | string | Тип заседания (TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, HALF_PLUS_ONE) |
| id | number | ID заседания для удаления |

**Примечание**: Можно указать либо `type`, либо `id`.

---

*Последнее обновление: 2025-10-16*
