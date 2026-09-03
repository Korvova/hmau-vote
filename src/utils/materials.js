// Материалы к вопросу повестки (поле AgendaItem.link).
// Это либо файл, загруженный на сервер (/uploads/agenda/...), либо внешняя ссылка.

export function materialsHref(link) {
  const s = String(link || '').trim();
  if (!s) return '';
  // Файл, загруженный на сервер: открываем под префиксом сайта (/hmau-vote/uploads/...),
  // чтобы работало и через прокси, который пробрасывает только /hmau-vote/ и /api/
  if (s.startsWith('/uploads/')) return `/hmau-vote${s}`;
  if (s.startsWith('/')) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;   // уже со схемой (http, https, file, ...)
  return `https://${s}`;                          // «голый» домен
}

export function isUploadedMaterial(link) {
  return /^\/uploads\//.test(String(link || ''));
}

export function materialsFileName(link) {
  return String(link || '').split('/').pop();
}

// Загрузка файла на сервер; возвращает url вида /uploads/agenda/<file>
export async function uploadMaterialsFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/agenda-items/upload', { method: 'POST', body: fd, credentials: 'include' });
  let data = null;
  try { data = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) throw new Error((data && data.error) || `Ошибка загрузки (${res.status})`);
  return data.url;
}
