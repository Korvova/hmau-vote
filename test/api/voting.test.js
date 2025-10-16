/**
 * Тесты для запуска голосования и таймера
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

describe('Voting Timer Tests', () => {
  let meetingId;
  let agendaItemId;
  let authCookie;

  beforeAll(async () => {
    // Авторизация
    const loginResp = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin'
    });
    authCookie = loginResp.headers['set-cookie']?.[0] || '';

    // Создаем тестовое заседание
    const meetingResp = await axios.post(
      `${API_BASE}/meetings`,
      {
        title: 'Test Meeting for Voting Timer',
        date: new Date().toISOString(),
        createInTelevic: false
      },
      { headers: { Cookie: authCookie } }
    );
    meetingId = meetingResp.data.id;

    // Создаем вопрос повестки
    const agendaResp = await axios.post(
      `${API_BASE}/meetings/${meetingId}/agenda`,
      {
        title: 'Test Agenda Item',
        order: 1
      },
      { headers: { Cookie: authCookie } }
    );
    agendaItemId = agendaResp.data.id;
  });

  afterAll(async () => {
    // Удаляем тестовое заседание
    if (meetingId) {
      await axios.delete(`${API_BASE}/meetings/${meetingId}`, {
        headers: { Cookie: authCookie }
      }).catch(() => {});
    }
  });

  test('Должен создать голосование с длительностью из шаблона', async () => {
    // Получаем список шаблонов длительности
    const templatesResp = await axios.get(`${API_BASE}/duration-templates`, {
      headers: { Cookie: authCookie }
    });

    expect(templatesResp.status).toBe(200);
    expect(Array.isArray(templatesResp.data)).toBe(true);
    expect(templatesResp.data.length).toBeGreaterThan(0);

    const template60 = templatesResp.data.find(t => t.duration === 60);
    expect(template60).toBeDefined();

    // Запускаем голосование с шаблоном 60 секунд
    const voteResp = await axios.post(
      `${API_BASE}/meetings/${meetingId}/votes`,
      {
        agendaItemId: agendaItemId,
        question: 'Test Vote Question',
        durationTemplateId: template60.id,
        type: 'simple',
        options: ['За', 'Против', 'Воздержался']
      },
      { headers: { Cookie: authCookie } }
    );

    expect(voteResp.status).toBe(200);
    expect(voteResp.data.duration).toBe(60);
    expect(voteResp.data.endTime).toBeDefined();

    // Проверяем, что endTime корректно рассчитан
    const createdAt = new Date(voteResp.data.createdAt);
    const endTime = new Date(voteResp.data.endTime);
    const durationMs = endTime.getTime() - createdAt.getTime();
    const durationSec = Math.round(durationMs / 1000);

    // Длительность должна быть 60 секунд (допускаем погрешность ±1 сек)
    expect(durationSec).toBeGreaterThanOrEqual(59);
    expect(durationSec).toBeLessThanOrEqual(61);
  });

  test('Должен создать голосование с кастомной длительностью', async () => {
    const voteResp = await axios.post(
      `${API_BASE}/meetings/${meetingId}/votes`,
      {
        agendaItemId: agendaItemId,
        question: 'Test Vote Custom Duration',
        duration: 45,
        type: 'simple',
        options: ['За', 'Против', 'Воздержался']
      },
      { headers: { Cookie: authCookie } }
    );

    expect(voteResp.status).toBe(200);
    expect(voteResp.data.duration).toBe(45);
    expect(voteResp.data.endTime).toBeDefined();

    // Проверяем, что endTime корректно рассчитан для 45 секунд
    const createdAt = new Date(voteResp.data.createdAt);
    const endTime = new Date(voteResp.data.endTime);
    const durationMs = endTime.getTime() - createdAt.getTime();
    const durationSec = Math.round(durationMs / 1000);

    expect(durationSec).toBeGreaterThanOrEqual(44);
    expect(durationSec).toBeLessThanOrEqual(46);
  });

  test('Должен корректно обрабатывать голосование без длительности', async () => {
    const voteResp = await axios.post(
      `${API_BASE}/meetings/${meetingId}/votes`,
      {
        agendaItemId: agendaItemId,
        question: 'Test Vote No Duration',
        type: 'simple',
        options: ['За', 'Против', 'Воздержался']
      },
      { headers: { Cookie: authCookie } }
    );

    expect(voteResp.status).toBe(200);

    // Без длительности endTime может быть null или undefined
    // Но голосование должно быть создано
    expect(voteResp.data.id).toBeDefined();
    expect(voteResp.data.status).toBe('PENDING');
  });

  test('Должен завершить голосование вручную', async () => {
    // Создаем голосование
    const voteResp = await axios.post(
      `${API_BASE}/meetings/${meetingId}/votes`,
      {
        agendaItemId: agendaItemId,
        question: 'Test Vote Manual End',
        duration: 120,
        type: 'simple',
        options: ['За', 'Против', 'Воздержался']
      },
      { headers: { Cookie: authCookie } }
    );

    const voteId = voteResp.data.id;

    // Завершаем голосование вручную
    const endResp = await axios.post(
      `${API_BASE}/meetings/${meetingId}/votes/${voteId}/end`,
      {},
      { headers: { Cookie: authCookie } }
    );

    expect(endResp.status).toBe(200);
    expect(endResp.data.status).toBe('ENDED');
  });
});
