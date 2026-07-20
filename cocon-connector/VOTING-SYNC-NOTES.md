# Синхронизация голосов из CoCon в базу данных сайта

## Дата: 2025-10-15

## Цель:
Когда пользователь голосует на пульте CoCon → результаты записываются в базу данных сайта → отображаются в таблице голосов

## Как работает голосование на сайте (изучено):

1. **Пользователь видит модальное окно** с кнопками "За", "Против", "Воздержусь"
2. **Нажимает кнопку** → вызывается `handleSelectChoice(choice)` в `UserPage.jsx:203-218`
3. **Отправляется API запрос** `submitVoteByResult` → `POST /api/vote-by-result`
4. **Сервер записывает голос** в таблицу `Vote` и обновляет счетчики в `VoteResult`
5. **PostgreSQL NOTIFY** → фронтенд обновляется в реальном времени

## Что нужно сделать для CoCon:

**То же самое, но источник данных - пульты CoCon:**
- Когда голосование заканчивается → получить результаты от CoCon API
- Найти связь делегат (CoCon) ↔ пользователь (сайт) через `televicExternalId`
- Записать голоса в базу (как будто пользователь проголосовал на сайте)
- Счетчики обновятся автоматически, фронтенд получит уведомление

---

## Шаг 1: Добавлена функция getIndividualVotingResults ✅

**Файл:** `/var/www/PC-vercion-Out-app-cocon-node/src/backend/coconClient.js`

**Строки:** 393-414

**Что делает:**
- Вызывает API CoCon: `GET /Voting/GetIndividualVotingResults/?Id={agendaId}`
- Возвращает массив голосов: `[{DelegateId, VotingOptionId, SeatNumber}, ...]`

**Формат ответа от CoCon:**
```json
{
  "IndividualVotingResults": {
    "Id": 112,
    "VotingResults": [
      {"DelegateId": 174, "VotingOptionId": 247, "SeatNumber": 13},
      {"DelegateId": 175, "VotingOptionId": 248, "SeatNumber": 14},
      {"DelegateId": 176, "VotingOptionId": 249, "SeatNumber": 15}
    ]
  }
}
```

---

## Следующие шаги:

### Шаг 2: Протестировать API
- Запустить голосование в CoCon
- Проголосовать на пультах
- Вызвать `getIndividualVotingResults` через curl или коннектор
- Проверить что возвращаются корректные данные

### Шаг 3: Изучить события VotingState
- Понять как коннектор получает событие когда голосование останавливается
- Событие: `{"VotingState":{"Id":11, "State":"Stop"}}`

### Шаг 4: Создать votingResultsSync.js
- Модуль который слушает событие `VotingState` со `State=Stop`
- При получении → вызывает `getIndividualVotingResults`
- Отправляет результаты на сервер

### Шаг 5: Добавить поле coconAgendaId в базу
- Миграция Prisma для связи `AgendaItem.id` ↔ `CoCon AgendaId`

### Шаг 6: Обработать результаты на сервере
- В `vote.cjs` добавить обработчик события от коннектора
- Для каждого голоса найти пользователя по `televicExternalId`
- Записать в таблицу `Vote` используя существующую логику

### Шаг 7: Тестирование
- End-to-end тест: голосование на пульте → запись в базу → отображение на сайте

---

## Важные детали:

### Маппинг VotingOptionId → choice
При создании шаблона опции идут в порядке:
1. Option1 → За (Green) → VotingOptionId=? → choice='FOR'
2. Option2 → Против (Red) → VotingOptionId=? → choice='AGAINST'
3. Option3 → Воздержался (Yellow) → VotingOptionId=? → choice='ABSTAIN'

**TODO:** Определить как получить VotingOptionId для каждой опции

### Связь пользователей
- Таблица `User` имеет поле `televicExternalId` (уникальное)
- В CoCon делегат имеет `DelegateId`
- Маппинг: `User.televicExternalId == CoCon.DelegateId`
- Страница для настройки связи: https://rms-bot.com/hmau-vote/linkprofile

---

## Риски и предостережения:

1. **НЕ ТРОГАТЬ существующий код голосования** - всё работает, не ломать!
2. **Новая функциональность в отдельных файлах** - минимум изменений существующих файлов
3. **Тестировать пошагово** - сначала проверить что API возвращает данные, потом обработка

---

## Статус:
- ✅ Шаг 1: Функция `getIndividualVotingResults` добавлена
- ⏳ Шаг 2: Тестирование API (следующий шаг)
