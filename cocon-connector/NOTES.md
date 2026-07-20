# Заметки по разработке CoCon Connector

## 📡 Получение логов через Socket.IO

**Реализовано:** Коннектор отправляет все console.log на сервер в реальном времени!

### Как работает:

1. **На коннекторе** (socketClient.js): Перехватываем console.log и отправляем через Socket.IO
```javascript
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args); // Still log locally
  if (sock && sock.connected) {
    sock.emit('connector:log', {
      timestamp: new Date().toISOString(),
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
    });
  }
};
```

2. **На сервере** (server.cjs): Принимаем и выводим с префиксом [CONNECTOR]
```javascript
socket.on('connector:log', (data) => {
  const { timestamp, message } = data || {};
  console.log(`[CONNECTOR] ${timestamp} ${message}`);
});
```

3. **Мониторинг на сервере:**
```bash
pm2 logs voting-api --lines 0 | grep "\[CONNECTOR\]"
```

### Преимущества:
- ✅ Не нужен SSH/RDP доступ к ПК
- ✅ Не нужен публичный IP или NAT настройка
- ✅ Логи в реальном времени
- ✅ Можно дебажить удаленно
- ✅ Используется существующее Socket.IO соединение

### Использование:
```bash
# Запустить мониторинг логов коннектора
timeout 120 pm2 logs voting-api --lines 0 2>&1 | grep -E "\[CONNECTOR\]" --line-buffered

# Отправить команду на коннектор через Socket.IO
curl -X POST http://localhost:5000/api/start-vote -H "Content-Type: application/json" \
  -d '{"agendaItemId":14,"question":"Test","duration":30,"procedureId":2,"voteType":"OPEN"}'
```

## 🔍 Отладка голосования

1. Запустить мониторинг логов коннектора
2. Запустить голосование через API
3. Наблюдать логи в реальном времени:
   - StartVoting, StopVoting команды
   - GetIndividualVotingResults вызовы
   - Результаты голосования
   - Ошибки CoCon API

## 📝 TODO
- [ ] Добавить фильтрацию логов по уровню (debug, info, error)
- [ ] Добавить буферизацию логов для уменьшения нагрузки на Socket.IO
- [ ] Добавить возможность запрашивать последние N строк логов по команде
