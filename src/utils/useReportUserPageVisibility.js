import { useEffect } from 'react';
import socket from './socket.js';

// Кабинет депутата докладывает серверу, на экране ли он (по этому ПК).
// Сервер запоминает IP → мостик Veyon не открывает страницу там, где кабинет уже виден.
// Шлём при монтировании, при смене видимости и раз в 20 с (сервер держит доклад 90 с).
const REPORT_EVERY_MS = 20000;

export default function useReportUserPageVisibility(userId) {
  useEffect(() => {
    const report = () => {
      try {
        socket.emit('user-page-visibility', { visible: document.visibilityState === 'visible', userId: userId || null });
      } catch { /* ignore */ }
    };
    if (!socket.connected) { try { socket.connect(); } catch { /* ignore */ } }
    report();
    socket.on('connect', report);
    document.addEventListener('visibilitychange', report);
    const timer = setInterval(report, REPORT_EVERY_MS);
    return () => {
      clearInterval(timer);
      socket.off('connect', report);
      document.removeEventListener('visibilitychange', report);
      // уходим со страницы — кабинета на экране больше нет
      try { socket.emit('user-page-visibility', { visible: false, userId: userId || null }); } catch { /* ignore */ }
    };
  }, [userId]);
}
