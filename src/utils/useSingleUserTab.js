import { useEffect } from 'react';

// Кабинет депутата в одной вкладке. В зале Veyon при старте голосования открывает
// этот адрес заново (всегда новой вкладкой). Чтобы вкладки не копились:
//  1) новая вкладка спрашивает по BroadcastChannel, виден ли кабинет в какой-то
//     старой вкладке (visibilityState === 'visible');
//  2) если виден — новая вкладка закрывает себя, депутат ничего не замечает;
//  3) если нет (другая вкладка, свёрнуто, перекрыто) — старые вкладки закрывают
//     себя, новая остаётся впереди.
// Закрыть себя может вкладка с одной записью в истории (открытая системой/Veyon)
// или открытая скриптом; остальные просто остаются.
const USER_TAB_CHANNEL = 'rms-user-page-tab';
const USER_TAB_PROBE_MS = 500;
// Когда Veyon открывает новую вкладку, браузер сразу переключается на неё, и старая
// вкладка в момент опроса уже «скрыта». Поэтому считаем её видимой, если она ушла
// в фон не раньше, чем за столько мс до опроса (т.е. была на экране до самого открытия новой).
const USER_TAB_RECENTLY_VISIBLE_MS = 6000;
// Идентификатор сборки (подставляет vite.config.js). Ответ «я на экране» от вкладки с ДРУГОЙ
// (старой) сборкой не считается: новая вкладка остаётся, старая уходит — так обновления
// сайта доезжают до зала с первого же открытия страницы, без F5 на каждом ПК.
// eslint-disable-next-line no-undef
const BUILD = typeof __RMS_BUILD__ !== 'undefined' ? String(__RMS_BUILD__) : 'dev';
export default function useSingleUserTab() {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    let ch;
    try { ch = new BroadcastChannel(USER_TAB_CHANNEL); } catch { return undefined; }
    const myId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let someoneVisible = false;
    let hiddenAt = 0;
    const onVisibility = () => { if (document.visibilityState === 'hidden') hiddenAt = Date.now(); };
    document.addEventListener('visibilitychange', onVisibility);
    const wasOnScreen = () =>
      document.visibilityState === 'visible' || (hiddenAt > 0 && Date.now() - hiddenAt < USER_TAB_RECENTLY_VISIBLE_MS);
    const closeSelf = () => { try { window.close(); } catch { /* браузер не дал — оставляем */ } };
    // Старую вкладку браузер может не дать закрыть (в истории больше одной записи):
    // тогда превращаем её в лёгкую страницу-заглушку, чтобы не держать второй живой кабинет
    const retireSelf = () => {
      closeSelf();
      setTimeout(() => { try { window.location.replace('/hmau-vote/closed.html'); } catch { /* ignore */ } }, 300);
    };
    ch.onmessage = (e) => {
      const msg = e && e.data;
      if (!msg || msg.id === myId) return;
      if (msg.type === 'probe') {
        if (wasOnScreen()) ch.postMessage({ type: 'visible', id: myId, to: msg.id, build: BUILD });
      } else if (msg.type === 'visible' && msg.to === myId) {
        if (msg.build === BUILD) someoneVisible = true; // старая сборка на экране — не в счёт, вытесняем
      } else if (msg.type === 'takeover') {
        retireSelf();
      }
    };
    ch.postMessage({ type: 'probe', id: myId });
    const timer = setTimeout(() => {
      if (someoneVisible) closeSelf();
      else ch.postMessage({ type: 'takeover', id: myId });
    }, USER_TAB_PROBE_MS);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility); ch.close(); };
  }, []);
}
