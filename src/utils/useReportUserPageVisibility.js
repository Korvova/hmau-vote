import { useEffect } from 'react';
import socket from './socket.js';

// Кабинет депутата докладывает серверу, на экране ли он и с какого ПК.
// IP клиента сервер узнать не может (Docker Desktop показывает всех как 172.18.0.1),
// поэтому ПК идентифицирует себя сам: мостик Veyon открывает страницу как
// /hmau-vote/user?pc=<IP ПК>, страница запоминает pc в localStorage и дальше
// всегда докладывает его. Сервер держит доклад 90 с, шлём раз в 20 с.
const REPORT_EVERY_MS = 20000;
const PC_KEY = 'rmsPcId';

export function rememberPcFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const pc = (params.get('pc') || '').trim();
    if (pc) {
      localStorage.setItem(PC_KEY, pc);
      // убираем ?pc= из адреса, историю не трогаем (replace)
      params.delete('pc');
      const rest = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
    }
    return localStorage.getItem(PC_KEY) || null;
  } catch {
    return null;
  }
}

export default function useReportUserPageVisibility(userId) {
  useEffect(() => {
    const pc = rememberPcFromUrl();
    const report = (visible) => {
      try {
        socket.emit('user-page-visibility', {
          visible: typeof visible === 'boolean' ? visible : document.visibilityState === 'visible',
          userId: userId || null,
          pc,
        });
      } catch { /* ignore */ }
    };
    const onVisibility = () => report();
    const onConnect = () => report();
    if (!socket.connected) { try { socket.connect(); } catch { /* ignore */ } }
    report();
    socket.on('connect', onConnect);
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(() => report(), REPORT_EVERY_MS);
    return () => {
      clearInterval(timer);
      socket.off('connect', onConnect);
      document.removeEventListener('visibilitychange', onVisibility);
      report(false); // уходим со страницы — кабинета на экране больше нет
    };
  }, [userId]);
}
