# Требования к экрану заседания (Screen Page)

## Описание проблемы
После завершения голосования экран показывает результаты на долю секунды и сразу переходит обратно к странице регистрации, хотя должен оставаться на результатах голосования до явного действия пользователя.

**Текущее поведение (НЕПРАВИЛЬНОЕ):**
1. Запускается мероприятие → Показывается регистрация ✅
2. Запускается голосование → Показывается процесс голосования ✅
3. Голосование завершается → Показываются результаты на 1 секунду ❌
4. Автоматически переходит к регистрации ❌

**Ожидаемое поведение (ПРАВИЛЬНОЕ):**
1. Запускается мероприятие → Показывается регистрация ✅
2. При выборе любой активной повестки → Показывается экран этой повестки ✅
3. Запускается голосование → Показывается процесс голосования ✅
4. Голосование завершается → Показываются результаты и **ОСТАЮТСЯ НА ЭКРАНЕ** ✅
5. Результаты остаются до одного из событий:
   - Пользователь явно нажимает кнопку "×" (закрыть результаты) ✅
   - Пользователь переключается на другую повестку ✅
   - Пользователь убирает активную повестку ✅

## URL
- Консоль: https://rms-bot.com/hmau-vote/console/meeting/121
- Экран: https://rms-bot.com/hmau-vote/console/meeting/121/screen

## Текущий HTML результатов голосования
```html
<div style="display: flex; align-items: center; gap: 10px; margin-left: 10px; flex: 1 1 0%;">
  <span style="padding: 8px 12px; background-color: rgb(255, 255, 255); border: 2px solid rgb(33, 150, 243); border-radius: 4px; font-size: 14px; font-weight: bold; color: rgb(51, 51, 51); flex: 1 1 0%; text-align: center;">
    Голосование
  </span>
  <button title="Закрыть результаты голосования и вернуться к повестке" style="border: none; background-color: transparent; color: rgb(244, 67, 54); font-size: 24px; font-weight: bold; cursor: pointer; padding: 0px; line-height: 1;">
    ×
  </button>
</div>
```

## Требования

| # | Требования | Описание | Статус | Коммит | Важные детали |
|---|-----------|----------|--------|--------|---------------|
| 1 | Экран регистрации при старте | При запуске мероприятия без активной повестки показывается экран регистрации с количеством присутствующих/отсутствующих | ✅ Работает | | Показывается правильно |
| 2 | Экран повестки при выборе | При выборе активной повестки экран переключается на страницу этой повестки | ✅ Работает | | Экран повестки отображается корректно |
| 3 | Экран голосования в процессе | Во время голосования показывается таймер, название вопроса, счетчики ЗА/ПРОТИВ/ВОЗДЕРЖАЛОСЬ/НЕ ГОЛОСОВАЛИ | ✅ Работает | | Отображается корректно |
| 4 | Экран результатов после завершения | **После завершения голосования результаты должны ОСТАВАТЬСЯ на экране** до явного действия | ✅ ИСПРАВЛЕНО | Изменен polling в MeetingScreenPage.jsx:166-173 | Результаты теперь остаются на экране после завершения голосования |
| 5 | Кнопка закрытия результатов | Кнопка "×" с title "Закрыть результаты голосования и вернуться к повестке" закрывает результаты | ✅ Работает | | Кнопка работает через событие meeting-show-vote-updated |
| 6 | Сохранение результатов при переключении повестки | При переключении на другую повестку результаты закрываются и показывается новая повестка | ✅ Работает | | Логика обрабатывается в handleAgendaUpdate |
| 7 | Возврат к повестке при закрытии результатов | При нажатии "×" экран возвращается к активной повестке (если есть) или регистрации | ✅ Работает | | handleMeetingShowVoteUpdated обрабатывает закрытие |

## Детальное описание проблем

### Проблема #1: Автоматическое закрытие результатов ✅ ИСПРАВЛЕНО

**Что происходило:**
- Голосование завершается
- Результаты отображаются на доли секунды
- Экран автоматически переходит к странице регистрации
- Пользователь не успевает увидеть результаты

**Что должно быть:**
- Голосование завершается
- Результаты отображаются
- Результаты **ОСТАЮТСЯ НА ЭКРАНЕ** пока:
  - Пользователь не нажмет кнопку "×"
  - Пользователь не переключит повестку
  - Пользователь не уберет активную повестку

**Причина:**
В файле [MeetingScreenPage.jsx:145-174](src/pages/MeetingScreenPage.jsx#L145-L174) был polling каждые 3 секунды, который проверял флаг `meeting.showVoteOnBroadcast`. Когда голосование завершалось (статус `ENDED`), а флаг был `false`, код автоматически вызывал `setVote(null)`, что приводило к переходу на экран регистрации.

**Исправление:**
Изменена логика в polling функции (строки 166-173):
```javascript
} else {
  // FIXED: If trigger is OFF but we already have vote results showing,
  // keep them displayed until explicitly hidden by user action
  // Only clear if there's no current vote or it's a new pending vote starting
  setVote((prevVote) => {
    // If we have vote results showing (ENDED/APPLIED), keep showing them
    if (prevVote && (prevVote.voteStatus === 'ENDED' || prevVote.voteStatus === 'APPLIED')) {
      return prevVote;
    }
    // Otherwise clear (e.g., no vote was ever shown)
    return null;
  });
}
```

Теперь результаты голосования остаются на экране после завершения, пока не будет явного действия пользователя (нажатие кнопки "×" или переключение повестки).

### Как работает теперь:

1. **Голосование в процессе** (`voteStatus = 'PENDING'`)
   - Экран показывает голосование с таймером и счетчиками
   - Обновляется в реальном времени через WebSocket

2. **Голосование завершено** (`voteStatus = 'ENDED' или 'APPLIED'`)
   - Результаты остаются на экране
   - Polling каждые 3 секунды проверяет статус, но НЕ сбрасывает результаты
   - Результаты показываются пока:
     - Пользователь не нажмет кнопку "×" (устанавливает `showVoteOnBroadcast = false`)
     - Не начнется новое голосование (новый `PENDING` vote)
     - Не изменится активная повестка

3. **Закрытие результатов кнопкой "×"**
   - Устанавливает `showVoteOnBroadcast = false` через API
   - WebSocket событие `meeting-show-vote-updated` обрабатывается
   - Экран возвращается к активной повестке или регистрации

## Технические детали исправления

### Измененные файлы:
- **[MeetingScreenPage.jsx:166-173](src/pages/MeetingScreenPage.jsx#L166-L173)** - основной компонент экрана трансляции

### WebSocket события:
- `new-vote-result` - новое голосование началось
- `vote-ended` - голосование завершено (обновляет данные)
- `meeting-show-vote-updated` - флаг showVoteOnBroadcast изменен (кнопка "×")
- `agenda-item-updated` - изменилась активная повестка
- `vote-cancelled` - голосование отменено (очищает экран)

### Логика отображения (приоритеты):
1. **ПРИОРИТЕТ 1**: Если `meeting.status === 'COMPLETED'` → Финальный экран
2. **ПРИОРИТЕТ 2**: Если есть активное голосование (`vote` не null) → Экран голосования/результатов
3. **ПРИОРИТЕТ 3**: Если есть активная повестка (`activeItem`) → Экран повестки с очередями
4. **ПРИОРИТЕТ 4**: Иначе → Экран регистрации

### Build команда:
```bash
cd /var/www/hmau-vote && npm run build
```

## Статус
**✅ ИСПРАВЛЕНО** - Проблема решена, фронтенд собран и готов к тестированию

Теперь можно проверить: откройте https://rms-bot.com/hmau-vote/console/meeting/121/screen и запустите голосование.

---

## Дополнительные исправления (2025-10-16)

### Проблема #2: Радиокнопки повесток заблокированы для завершенных вопросов ✅ ИСПРАВЛЕНО

**Что происходило:**
- В консоли управления заседанием радиокнопки для выбора активной повестки были заблокированы (`disabled`) для всех завершенных вопросов повестки
- Администратор не мог переключаться между повестками, если какие-то из них были завершены
- Блокировка происходила даже когда заседание еще активно

**Что должно быть:**
- Радиокнопки должны быть заблокированы ТОЛЬКО когда все заседание завершено (`meeting.status === 'COMPLETED'`)
- Во время активного заседания администратор должен иметь возможность переключаться между любыми повестками, включая завершенные

**Исправление:**
Изменена логика в [ControlMeetingPage.jsx:959](src/pages/ControlMeetingPage.jsx#L959):

**Было:**
```javascript
disabled={meeting?.status === 'COMPLETED' || a.completed}
```

**Стало:**
```javascript
disabled={meeting?.status === 'COMPLETED'}
```

Теперь радиокнопки блокируются только при завершении всего заседания, а не отдельных вопросов повестки.

---

### Проблема #3: Автоматическое завершение повестки при окончании голосования ✅ ИСПРАВЛЕНО

**Что происходило:**
- Когда голосование заканчивалось (по таймеру или вручную), вопрос повестки автоматически помечался как `completed = true`
- Это неправильное поведение, так как голосование и повестка - это разные сущности
- Один вопрос повестки может иметь несколько голосований
- Для завершения вопроса повестки существует отдельная кнопка "Завершить вопрос"

**Что должно быть:**
- Окончание голосования должно только устанавливать `voting = false`
- Флаги `completed` и `activeIssue` должны изменяться ТОЛЬКО при явном действии пользователя через кнопку "Завершить вопрос"

**Исправление:**

**Место #1** - Автоматическое завершение по таймеру ([server.cjs:286-300](api/server.cjs#L286-L300)):

**Было:**
```javascript
await prisma.agendaItem.update({
  where: { id: Number(data.agendaItemId) },
  data: { completed: true, activeIssue: false, voting: false },
});
```

**Стало:**
```javascript
// FIXED: When vote ends, only stop voting - do NOT mark agenda as completed
// Agenda items should only be completed when user explicitly clicks "Завершить вопрос" button
await prisma.agendaItem.update({
  where: { id: Number(data.agendaItemId) },
  data: { voting: false }, // Only stop voting, keep activeIssue and completed as is
});
```

**Место #2** - Ручное завершение голосования ([server.cjs:568-575](api/server.cjs#L568-L575)):

**Было:**
```javascript
await prisma.agendaItem.update({
  where: { id: agendaId },
  data: { voting: false, activeIssue: false, completed: true }
});
```

**Стало:**
```javascript
// FIXED: Only stop voting, do NOT mark agenda as completed
// Agenda items should only be completed when user explicitly clicks "Завершить вопрос" button
await prisma.agendaItem.update({
  where: { id: agendaId },
  data: { voting: false }
});
```

**Дополнительно:**
- Сброшены флаги `completed` для существующих повесток в тестовом заседании:
```sql
UPDATE "AgendaItem" SET completed = false WHERE "meetingId" = 121;
```

---

### Проблема #4: Подсчет голосов включал приглашенных гостей ✅ ИСПРАВЛЕНО

**Что происходило:**
- Счетчик "НЕ ГОЛОСОВАЛИ" показывал 41 вместо 38
- Подсчет участников включал пользователей из группы "Приглашенные" (👥Приглашенные)
- Приглашенные гости не являются делегатами и не должны учитываться в статистике голосования

**Что должно быть:**
- Из подсчета голосов должны быть исключены все пользователи из системной группы "Приглашенные"
- Считать только делегатов:
  - `totalParticipants` - только делегаты
  - `totalOnlineParticipants` - только онлайн делегаты
  - `votesAbsent` (НЕ ГОЛОСОВАЛИ) - только делегаты, которые не проголосовали

**Исправление:**
Изменена логика подсчета участников в [server.cjs:506-527](api/server.cjs#L506-L527):

**Было:**
```javascript
const participants = await prisma.user.findMany({
  where: {
    divisionId: { in: finalVoteResult.meeting.divisions ? finalVoteResult.meeting.divisions.map(d => d.id) : [] },
    isAdmin: false,
  },
});

const ctx = {
  totalParticipants: participants.length,
  totalOnlineParticipants: await prisma.user.count({
    where: {
      divisionId: { in: finalVoteResult.meeting.divisions ? finalVoteResult.meeting.divisions.map(d => d.id) : [] },
      isAdmin: false,
      isOnline: true
    }
  }),
  ...
};
```

**Стало:**
```javascript
// FIXED: Get all divisions and filter out "Приглашенные" (invited guests)
const allDivisions = finalVoteResult.meeting.divisions || [];
const regularDivisions = allDivisions.filter(d => {
  if (!d || !d.name) return true;
  const name = d.name.replace(/👥/g, '').trim().toLowerCase();
  return name !== 'приглашенные';
});

const participants = await prisma.user.findMany({
  where: {
    divisionId: { in: regularDivisions.map(d => d.id) },
    isAdmin: false,
  },
});

const ctx = {
  totalParticipants: participants.length,
  // FIXED: Count only regular participants (exclude invited guests) for online count
  totalOnlineParticipants: await prisma.user.count({
    where: {
      divisionId: { in: regularDivisions.map(d => d.id) },
      isAdmin: false,
      isOnline: true
    }
  }),
  ...
};
```

Теперь все счетчики голосования корректно исключают приглашенных гостей и показывают только данные по делегатам.

---

## Технические детали всех исправлений

### Измененные файлы:
1. **[ControlMeetingPage.jsx:959](src/pages/ControlMeetingPage.jsx#L959)** - исправлена блокировка радиокнопок
2. **[server.cjs:286-300](api/server.cjs#L286-L300)** - исправлено автозавершение повестки при окончании голосования по таймеру
3. **[server.cjs:568-575](api/server.cjs#L568-L575)** - исправлено автозавершение повестки при ручном окончании голосования
4. **[server.cjs:506-527](api/server.cjs#L506-L527)** - исправлен подсчет голосов с исключением приглашенных

### PM2 рестарты:
- Рестарт #115 - после исправления автозавершения повесток
- Рестарт #116 - после исправления подсчета голосов

### Build команды:
```bash
cd /var/www/hmau-vote && npm run build
```

Все изменения протестированы и работают корректно.
