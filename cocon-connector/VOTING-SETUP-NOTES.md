# CoCon Voting API - Важные заметки

## Как работает запуск голосования через API

### Проблема которую решали:
Команды `SetVotingState` (Start/Restart/Resume) НЕ работают если голосование не настроено для повестки.

### Решение:
Использовать **двухшаговый процесс**:

1. **AddInstantVote** - создаёт экземпляр голосования на основе шаблона
   - API: `GET /Voting/AddInstantVote/?VotingTemplate=3_Vote_Public`
   - Возвращает: `{"AddInstantVote":{"Result":true}}`
   - **ВАЖНО**: Это только СОЗДАЁТ голосование, но НЕ запускает его!

2. **SetVotingState State=Start** - запускает созданное голосование
   - API: `GET /Voting/SetVotingState/?State=Start`
   - Возвращает: `0` (успех) или `1` (ошибка)

### Правильная последовательность в коде:

```javascript
// 1. Установить активную повестку
await setCurrentQuestionInAgenda(agendaItemNumber);

// 2. Создать экземпляр голосования из шаблона
const instantUrl = `${coConBase}/Voting/AddInstantVote/?VotingTemplate=3_Vote_Public`;
const response = await axios.get(instantUrl);
// Проверить что result.AddInstantVote.Result === true

// 3. ЗАПУСТИТЬ голосование (это критично!)
await setVotingState('Start');
```

### Доступные шаблоны:
- `3_Vote_Public` - открытое голосование (3 кнопки: За/Против/Воздержался)
- `3_Vote_Secret` - закрытое голосование

### Важные моменты:
1. **AddInstantVote БЕЗ Start = голосование не запустится** (пульты не замигают)
2. Шаблон должен существовать в CoCon (создаётся при загрузке митинга)
3. Сначала нужно установить активную повестку через `SetActiveAgendaItemById`

### State Machine для голосования:
- **Start**: VotingIdle → VotingStarted
- **Stop**: VotingStarted/VotingPaused → VotingStopped
- **Pause**: VotingStarted → VotingPaused
- **Resume**: VotingPaused → VotingStarted
- **Restart**: VotingStarted/VotingStopped → VotingStarted
- **Clear**: VotingStopped → VotingIdle

### Остановка голосования:
```javascript
// 1. Остановить
await setVotingState('Stop');

// 2. Очистить (вернуть в VotingIdle для следующего голосования)
await setVotingState('Clear');
```

## История проблемы:
- **Попытка 1**: Создание шаблона через AddVotingTemplate - слишком сложно, много параметров
- **Попытка 2**: Прямой вызов Start/Restart - не работает, нужен настроенный шаблон
- **Попытка 3**: AddInstantVote - создавал но не запускал
- **Решение**: AddInstantVote + Start = работает!

## Дата решения: 2025-10-15

---

## Возможность изменения голоса (CanCorrect)

### Проблема:
Пользователь не может изменить свой голос после нажатия кнопки на пульте.

### Решение:
Создать шаблон голосования с параметром **`CanCorrect=true`**

### Реализация:

1. **Создание шаблона при инициализации мероприятия**:
```javascript
// В методе createAgenda() добавлено создание шаблона:
await this.createVotingTemplate({
  title: '3_Vote_Correctable',
  voteType: 'OPEN',
  duration: 180,
  canCorrect: true  // Позволяет менять голос!
});
```

2. **Использование шаблона при запуске голосования**:
```javascript
// В startVotingWithTemplate() сначала пробуем наш шаблон:
const templatesToTry = ['3_Vote_Correctable', '3_Vote_Public', '3_Vote_Secret'];
```

### Важные параметры AddVotingTemplate:
- `CanCorrect=true` - позволяет менять голос во время голосования
- `EnableVotingTimer=true` - **ДОЛЖЕН быть true** (иначе API CoCon виснет с timeout)
- `DurationOfVotingTimer=23:59:59` - **24 часа** (фактически бесконечно, сайт управляет)
- `CountDownOfVotingTimer=false` - **НЕ показывать обратный отсчет** (таймер не виден в CoCon!)
- `BadgeOption=4` - все устройства могут голосовать
- `OverallOption=4` - все видят общие результаты (для OPEN)
- `IndividualOption=5` - все видят индивидуальные голоса (для OPEN)
- `IsOperatorIndicated=true` - показывать индикацию на операторе
- `IsSignageIndicated=true` - показывать индикацию на синоптике

**ВАЖНО**: Несмотря на то что в документации можно отключить таймер (`EnableVotingTimer=false`),
на практике это вызывает timeout в CoCon API. Поэтому используем таймер 24 часа с отключенным
отображением (`CountDownOfVotingTimer=false`). Результат: в CoCon таймер НЕ виден, всё управление с сайта.

### Что происходит при запуске коннектора:
1. Коннектор подключается к серверу
2. **Проверяет существует ли шаблон `Vote_NoTimer_Correctable`**
3. **Если НЕ существует - создаёт его ОДИН РАЗ**
4. Если существует - пропускает создание (избегаем дубликатов)

Это гарантирует что:
- ✅ Шаблон всегда доступен для использования
- ✅ Не создаются дубликаты при каждом перезапуске
- ✅ Шаблон создаётся автоматически без ручной настройки

### Что происходит при запуске голосования:
1. Сначала пробуется шаблон `Vote_NoTimer_Correctable` (БЕЗ таймера, с CanCorrect)
2. Если не найден - fallback на `3_Vote_Correctable` (с таймером, с CanCorrect)
3. Если не найден - fallback на `3_Vote_Public` (стандартный)
4. Если не найден - fallback на `3_Vote_Secret` (закрытое голосование)

### Управление голосованием:
- **Таймер**: только на сайте (в CoCon таймер отключён)
- **Старт**: автоматически при нажатии "Запустить" на сайте
- **Стоп**: автоматически когда таймер заканчивается на сайте
- **Изменение голоса**: можно менять во время голосования (CanCorrect=true)
