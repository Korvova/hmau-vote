# Автотесты для HMAU Vote

Этот каталог содержит автоматические тесты для проверки работоспособности системы голосования.

## Структура

- `api/` - Тесты API endpoints
  - `meeting.test.js` - Тесты создания/управления заседаниями
  - `participants.test.js` - Тесты настройки участников и доверенностей
  - `voting.test.js` - Тесты запуска и завершения голосования
  - `cocon.test.js` - Тесты интеграции с Televic CoCon

- `integration/` - Интеграционные тесты end-to-end
  - `full-meeting-flow.test.js` - Полный цикл заседания

- `helpers/` - Вспомогательные функции
  - `api-client.js` - HTTP клиент для запросов к API
  - `test-data.js` - Тестовые данные и фикстуры
  - `db-helper.js` - Хелпер для работы с БД

## Запуск тестов

### Все тесты
```bash
npm test
```

### Отдельный файл
```bash
npm test test/api/meeting.test.js
```

### С детальным выводом
```bash
npm test -- --verbose
```

## Требования

- Node.js >= 18
- Доступ к тестовой БД
- Запущенный API сервер (порт 5000)

## Переменные окружения

Создайте файл `.env.test` в корне проекта:

```env
API_URL=http://localhost:5000
DB_URL=postgresql://postgres:postgres@localhost:5432/voting_test
TEST_USER_EMAIL=test@admin.ru
TEST_USER_PASSWORD=test123
```

## Соглашения

1. Каждый тест должен быть **идемпотентным** - можно запустить много раз подряд
2. Тесты **не должны зависеть друг от друга** - порядок выполнения не важен
3. После каждого теста нужно **очищать** созданные данные
4. Используйте **осмысленные названия** тестов на русском языке
5. Добавляйте **комментарии** для сложной логики

## Пример теста

```javascript
const { apiClient } = require('../helpers/api-client');

describe('Создание заседания', () => {
  test('Должен создать заседание с повесткой', async () => {
    // Arrange
    const meetingData = {
      name: 'Тестовое заседание',
      startTime: new Date().toISOString(),
      // ...
    };

    // Act
    const response = await apiClient.post('/api/meetings', meetingData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.id).toBeDefined();

    // Cleanup
    await apiClient.delete(`/api/meetings/${response.data.id}`);
  });
});
```

## Отчеты

Отчеты о прогоне тестов сохраняются в `test/reports/`.
