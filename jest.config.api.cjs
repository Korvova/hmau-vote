/**
 * Конфигурация Jest для API тестов
 */

module.exports = {
  // Используем Node окружение (не jsdom)
  testEnvironment: 'node',

  // Паттерн для поиска тестов
  testMatch: [
    '**/test/api/**/*.test.js',
    '**/test/integration/**/*.test.js'
  ],

  // Таймаут для тестов (15 секунд)
  testTimeout: 15000,

  // Показывать детальную информацию
  verbose: true,

  // Собирать coverage
  collectCoverage: false,
  collectCoverageFrom: [
    'api/**/*.{js,cjs}',
    '!api/server.cjs',
    '!**/node_modules/**'
  ],

  // Игнорировать эти папки
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Настройка для работы с CommonJS модулями
  transform: {},

  // Очищать моки между тестами
  clearMocks: true,

  // Восстанавливать моки между тестами
  restoreMocks: true,

  // Максимальное количество одновременно выполняемых тестов
  maxWorkers: 1, // Запускаем тесты последовательно для избежания гонок в БД
};
