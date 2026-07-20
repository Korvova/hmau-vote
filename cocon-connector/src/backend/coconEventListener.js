const axios = require('axios');

class CoconEventListener {
  constructor({ store, socketClient }) {
    this.store = store;
    this.socketClient = socketClient;
    this.polling = false;
    this.delegateStates = new Map(); // Храним предыдущее состояние делегатов: delegateId -> { badgeInserted, seatNr }
    console.log('[CoconEventListener] Constructor initialized with POLLING mode');
  }

  get cfg() {
    return this.store.get('cocon') || {};
  }

  async start() {
    if (this.polling) {
      console.log('[CoconEventListener] Already polling, ignoring start()');
      return;
    }
    this.polling = true;
    console.log('[CoconEventListener] Starting badge polling...');
    console.log('[CoconEventListener] Using POLLING approach (checking every 3 seconds)');

    // Запускаем polling делегатов
    this.pollDelegateStates();
  }

  async pollDelegateStates() {
    // Если остановлено - не продолжаем
    if (!this.polling) {
      console.log('[CoconEventListener] Polling stopped');
      return;
    }

    try {
      const coConBase = (this.cfg.coConBase || '').replace(/\/$/, '');
      if (!coConBase) {
        setTimeout(() => this.pollDelegateStates(), 3000);
        return;
      }

      // Получаем ID текущей встречи
      const meetingId = await this.getRunningMeetingId(coConBase);
      if (!meetingId) {
        // Нет активной встречи - ждем 5 секунд и проверяем снова
        setTimeout(() => this.pollDelegateStates(), 5000);
        return;
      }

      // Получаем рассадку делегатов (кто на каком месте)
      const seatingUrl = `${coConBase}/Meeting_Agenda/GetDelegateSeating/?MeetingId=${encodeURIComponent(meetingId)}`;
      const seatingResp = await axios.get(seatingUrl, { timeout: 5000 });
      const seatingData = typeof seatingResp.data === 'string' ? JSON.parse(seatingResp.data) : seatingResp.data;
      const seating = seatingData?.GetDelegateSeating?.DelegateSeating || [];

      // Создаем Set делегатов которые сейчас на местах
      // ВАЖНО: SeatId = 0 означает что делегат НЕ на месте (карточка вынута)
      const delegatesOnSeats = new Set(
        seating
          .filter(s => s.SeatId !== 0) // Только делегаты с реальным местом
          .map(s => s.DelegateId)
      );

      // Получаем полный список делегатов в встрече
      const delegatesUrl = `${coConBase}/Delegate/GetDelegatesInMeeting/?MeetingId=${encodeURIComponent(meetingId)}`;
      const delegatesResp = await axios.get(delegatesUrl, { timeout: 5000 });
      const delegatesData = typeof delegatesResp.data === 'string' ? JSON.parse(delegatesResp.data) : delegatesResp.data;
      const delegates = delegatesData?.GetDelegatesInMeeting?.Delegates || [];

      // Обрабатываем каждого делегата
      for (const delegate of delegates) {
        const delegateId = delegate.Id;
        const seatNr = delegate.SeatNumber;
        const badgeNumber = delegate.BadgeNumber;

        // Badge inserted = делегат есть в списке GetDelegateSeating (на месте)
        const badgeInserted = delegatesOnSeats.has(delegateId);

        // Получаем предыдущее состояние
        const prevState = this.delegateStates.get(delegateId);

        // Если состояние изменилось - отправляем событие
        if (!prevState || prevState.badgeInserted !== badgeInserted) {
          console.log(`[CoconEventListener] 🎫 Badge ${badgeInserted ? 'INSERTED' : 'REMOVED'} for delegate ${delegateId} (${delegate.Name}) on seat ${seatNr}`);

          // Сохраняем новое состояние
          this.delegateStates.set(delegateId, { badgeInserted, seatNr, badgeNumber });

          // Отправляем событие на сервер
          if (this.socketClient && this.socketClient.socket) {
            this.socketClient.socket.emit('connector:event', {
              type: 'BadgeEvent',
              data: {
                seatNr: seatNr,
                delegateId: delegateId,
                badgeInserted: badgeInserted,
                badgeNumber: badgeNumber,
                timestamp: new Date().toISOString()
              }
            });
            console.log('[CoconEventListener] ✅ Emitted BadgeEvent to server');
          }
        }
      }

    } catch (error) {
      console.error('[CoconEventListener] Polling error:', error.message);
    }

    // Повторяем опрос через 3 секунды
    setTimeout(() => this.pollDelegateStates(), 3000);
  }

  async getRunningMeetingId(coConBase) {
    try {
      const url = `${coConBase}/Meeting_Agenda/GetAllMeetings`;
      const resp = await axios.get(url, { timeout: 5000 });
      const data = typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data;
      const meetings = data?.GetAllMeetings?.Meetings || [];
      const running = meetings.find(m => String(m.State).toLowerCase() === 'running');
      return running ? running.Id : null;
    } catch (error) {
      console.error('[CoconEventListener] Error getting running meeting:', error.message);
      return null;
    }
  }

  stop() {
    if (!this.polling) return;
    this.polling = false;
    console.log('[CoconEventListener] Stopped badge polling');
  }
}

module.exports = { CoconEventListener };
