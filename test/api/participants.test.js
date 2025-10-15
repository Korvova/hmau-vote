/**
 * Тесты для настройки участников заседания
 *
 * Проверяем:
 * - Получение списка участников
 * - Настройка местоположения (SITE/HALL)
 * - Передача доверенностей
 * - Расчет веса голоса
 */

const { apiClient } = require('../helpers/api-client');

describe('Участники заседания', () => {
  let testMeetingId = null;
  let testUsers = [];

  beforeAll(async () => {
    // Авторизуемся
    await apiClient.login();

    // Получаем список существующих заседаний для тестирования
    const meetings = await apiClient.getMeetings();
    if (meetings && meetings.length > 0) {
      // Используем последнее созданное заседание
      testMeetingId = meetings[meetings.length - 1].id;
      console.log(`[Test] Using meeting ID: ${testMeetingId}`);
    }

    // Получаем список пользователей
    testUsers = await apiClient.getUsers();
    console.log(`[Test] Found ${testUsers.length} users`);
  });

  test('Должен получить список участников заседания', async () => {
    if (!testMeetingId) {
      console.log('[Test] Skipped: no test meeting available');
      return;
    }

    const response = await apiClient.getMeetingParticipants(testMeetingId);

    expect(response).toBeDefined();
    expect(response.participants).toBeDefined();
    expect(Array.isArray(response.participants)).toBe(true);

    console.log(`[Test] Got ${response.participants.length} participants`);

    // Проверяем структуру данных участника
    if (response.participants.length > 0) {
      const participant = response.participants[0];
      expect(participant.id).toBeDefined();
      expect(participant.name).toBeDefined();
      expect(participant.divisions).toBeDefined();
      expect(participant.location).toBeDefined();
      expect(['SITE', 'HALL'].includes(participant.location)).toBe(true);
      expect(participant.voteWeight).toBeDefined();
      expect(participant.voteWeight).toBeGreaterThanOrEqual(1);
    }
  });

  test('Должен сохранить местоположение участников', async () => {
    if (!testMeetingId) {
      console.log('[Test] Skipped: no test meeting available');
      return;
    }

    // Получаем текущий список участников
    const { participants } = await apiClient.getMeetingParticipants(testMeetingId);

    if (participants.length === 0) {
      console.log('[Test] Skipped: no participants in meeting');
      return;
    }

    // Изменяем местоположение первых двух участников
    const updatedParticipants = participants.slice(0, 2).map((p, index) => ({
      userId: p.id,
      location: index === 0 ? 'HALL' : 'SITE',
      proxyToUserId: null
    }));

    // Сохраняем изменения
    const saveResponse = await apiClient.saveMeetingParticipants(testMeetingId, updatedParticipants);
    expect(saveResponse.success).toBe(true);

    // Проверяем, что изменения сохранились
    const { participants: updatedList } = await apiClient.getMeetingParticipants(testMeetingId);
    const firstParticipant = updatedList.find(p => p.id === updatedParticipants[0].userId);
    expect(firstParticipant.location).toBe('HALL');

    console.log('[Test] Location saved successfully');
  });

  test('Должен передать доверенность от одного участника другому', async () => {
    if (!testMeetingId) {
      console.log('[Test] Skipped: no test meeting available');
      return;
    }

    // Получаем участников
    const { participants } = await apiClient.getMeetingParticipants(testMeetingId);

    if (participants.length < 2) {
      console.log('[Test] Skipped: need at least 2 participants');
      return;
    }

    const fromUser = participants[0];
    const toUser = participants[1];

    // Передаем доверенность от первого участника второму
    const updatedParticipants = [{
      userId: fromUser.id,
      location: 'SITE',
      proxyToUserId: toUser.id
    }];

    const saveResponse = await apiClient.saveMeetingParticipants(testMeetingId, updatedParticipants);
    expect(saveResponse.success).toBe(true);

    // Проверяем результат
    const { participants: updatedList } = await apiClient.getMeetingParticipants(testMeetingId);

    const updatedFromUser = updatedList.find(p => p.id === fromUser.id);
    const updatedToUser = updatedList.find(p => p.id === toUser.id);

    // Проверяем, что доверенность передана
    expect(updatedFromUser.proxy).toBeDefined();
    expect(updatedFromUser.proxy.toUserId).toBe(toUser.id);

    // Проверяем, что получатель имеет увеличенный вес голоса
    expect(updatedToUser.voteWeight).toBe(2);
    expect(updatedToUser.receivedProxies).toBeDefined();
    expect(updatedToUser.receivedProxies.length).toBe(1);
    expect(updatedToUser.receivedProxies[0].fromUserId).toBe(fromUser.id);

    console.log(`[Test] Proxy from ${fromUser.name} to ${toUser.name} saved successfully`);

    // Cleanup: отменяем доверенность
    await apiClient.saveMeetingParticipants(testMeetingId, [{
      userId: fromUser.id,
      location: 'SITE',
      proxyToUserId: null
    }]);

    console.log('[Test] Proxy cleaned up');
  });

  test('Должен правильно рассчитывать вес голоса при множественных доверенностях', async () => {
    if (!testMeetingId) {
      console.log('[Test] Skipped: no test meeting available');
      return;
    }

    const { participants } = await apiClient.getMeetingParticipants(testMeetingId);

    if (participants.length < 4) {
      console.log('[Test] Skipped: need at least 4 participants');
      return;
    }

    // Три участника передают доверенность четвертому
    const receiver = participants[3];
    const givers = participants.slice(0, 3);

    const updatedParticipants = givers.map(p => ({
      userId: p.id,
      location: 'SITE',
      proxyToUserId: receiver.id
    }));

    await apiClient.saveMeetingParticipants(testMeetingId, updatedParticipants);

    // Проверяем вес голоса получателя
    const { participants: updatedList } = await apiClient.getMeetingParticipants(testMeetingId);
    const updatedReceiver = updatedList.find(p => p.id === receiver.id);

    expect(updatedReceiver.voteWeight).toBe(4); // 1 свой + 3 доверенности
    expect(updatedReceiver.receivedProxies.length).toBe(3);

    console.log(`[Test] ${receiver.name} has vote weight: ${updatedReceiver.voteWeight}`);

    // Cleanup: отменяем все доверенности
    for (const giver of givers) {
      await apiClient.saveMeetingParticipants(testMeetingId, [{
        userId: giver.id,
        location: 'SITE',
        proxyToUserId: null
      }]);
    }

    console.log('[Test] All proxies cleaned up');
  });
});
