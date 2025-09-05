import React, { useEffect, useMemo, useState } from 'react';

// Модалка редактирования/создания заседания
// - Название
// - Дата и время начала/окончания (datetime-local)
// - Подразделения (мультивыбор)
// - Список вопросов (номер, наименование, докладчик из выбранных подразделений, ссылка, удалить)
function MeetingModal({ open, data, divisions = [], users = [], title = 'Редактировать заседание', onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', startAt: '', endAt: '' });
  const [divisionIds, setDivisionIds] = useState([]);
  const [agenda, setAgenda] = useState([]); // { title, speakerId, link }
  const [addDivisionId, setAddDivisionId] = useState('');
  const [password, setPassword] = useState('');

  // Инициализация из входных данных
  useEffect(() => {
    if (!open) return;
    const next = { title: data?.title || data?.name || '', startAt: '', endAt: '' };
    // Преобразуем (startDate,startTime)/(endDate,endTime) -> datetime-local
    if (data?.startDate || data?.startTime) {
      const sd = data.startDate || '';
      const st = data.startTime || '';
      if (sd || st) next.startAt = `${sd}T${st}`.replace(/T$/, '');
    }
    if (data?.endDate || data?.endTime) {
      const ed = data.endDate || '';
      const et = data.endTime || '';
      if (ed || et) next.endAt = `${ed}T${et}`.replace(/T$/, '');
    }
    // Либо строка "YYYY-MM-DD HH:mm"
    if (!next.startAt && typeof data?.startTime === 'string' && data.startTime.includes(' ')) {
      const [sd, st] = data.startTime.split(' ');
      next.startAt = `${sd}T${st}`;
    }
    if (!next.endAt && typeof data?.endTime === 'string' && data.endTime.includes(' ')) {
      const [ed, et] = data.endTime.split(' ');
      next.endAt = `${ed}T${et}`;
    }
    setForm(next);

    // Подразделения: id или восстановить по названиям из строки
    let ids = Array.isArray(data?.divisionIds) ? data.divisionIds.slice() : [];
    if (!ids.length && typeof data?.divisions === 'string' && data.divisions.trim()) {
      const names = data.divisions.split(',').map(s => s.trim()).filter(Boolean);
      ids = divisions.filter(d => names.includes(d.name)).map(d => d.id);
    }
    setDivisionIds(ids);

    // Вопросы
    const ag = Array.isArray(data?.agenda) ? data.agenda.map(a => ({
      title: a.title || '',
      speakerId: a.speakerId ?? null,
      link: a.link || '',
    })) : [];
    setAgenda(ag);
    setPassword('');
  }, [open, data, divisions]);

  const selectedDivisionNames = useMemo(
    () => divisionIds.map(id => divisions.find(d => d.id === id)?.name).filter(Boolean),
    [divisionIds, divisions]
  );

  // Докладчики: по названию подразделения (бэк сейчас даёт users.division = имя)
  const eligibleUsers = useMemo(() => {
    if (!selectedDivisionNames.length) return [];
    return (users || []).filter(u => selectedDivisionNames.includes(u.division));
  }, [users, selectedDivisionNames]);

  const handleChange = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const handleAddDivision = (idFromEvent) => {
    const raw = idFromEvent ?? addDivisionId;
    const id = raw ? Number(raw) : null;
    if (!id || divisionIds.includes(id)) return;
    setDivisionIds(prev => [...prev, id]);
    setAddDivisionId('');
  };
  const handleRemoveDivision = (id) => setDivisionIds(prev => prev.filter(did => did !== id));

  const handleAddAgenda = () => setAgenda(prev => [...prev, { title: '', speakerId: null, link: '' }]);
  const handleRemoveAgenda = (idx) => setAgenda(prev => prev.filter((_, i) => i !== idx));
  const handleAgendaChange = (idx, patch) => setAgenda(prev => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const [sd, st] = (form.startAt || '').split('T');
    const [ed, et] = (form.endAt || '').split('T');
    const payload = {
      title: form.title,
      startDate: sd || '',
      startTime: st || '',
      endDate: ed || '',
      endTime: et || '',
      divisions: selectedDivisionNames.join(', '),
      divisionIds: divisionIds.slice(),
      agenda: agenda.map((a, idx) => ({ number: idx + 1, ...a })),
    };
    onSubmit?.(payload, password);
  };

  if (!open) return null;

  // Внешний слой скроллится колёсиком, а ещё сам модальный блок имеет внутренний скролл.
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999,
    overflowY: 'auto',
  };
  const modalStyle = {
    backgroundColor: '#fff', borderRadius: 12, padding: 32, width: 820, maxWidth: '95%',
    maxHeight: '80vh', overflowY: 'auto', position: 'relative',
  };
  const labelStyle = { display: 'block', marginBottom: 8, fontSize: 14 };
  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6' };
  const rowStyle = { display: 'flex', gap: 20 };
  const smallButton = { padding: '0 16px', height: 44, width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={{ position: 'absolute', top: 12, right: 12, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={onClose}
        >×</button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2>{title}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Название */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Название заседания *</label>
            <input style={inputStyle} required value={form.title} onChange={(e) => handleChange({ title: e.target.value })} />
          </div>

          {/* Дата/время начала и окончания — на одном уровне */}
          <div style={{ ...rowStyle, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={labelStyle}>Дата и время начала заседания</label>
              <input type="datetime-local" style={inputStyle} required value={form.startAt} onChange={(e) => handleChange({ startAt: e.target.value })} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={labelStyle}>Дата и время окончания заседания</label>
              <input type="datetime-local" style={inputStyle} required value={form.endAt} onChange={(e) => handleChange({ endAt: e.target.value })} />
            </div>
          </div>

          {/* Добавить подразделение */}
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Добавить подразделение</label>
            <select
              style={{ ...inputStyle, width: '100%' }}
              value={addDivisionId}
              onChange={(e) => { const v = e.target.value; setAddDivisionId(v); if (v) handleAddDivision(v); }}
            >
              <option value="">Без подразделения</option>
              {divisions.filter(d => !divisionIds.includes(d.id)).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Список выбранных подразделений */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Участвующие подразделения:</label>
            <div style={{ border: '1px solid #dcdcdc', borderRadius: 6, padding: 8, maxHeight: 160, overflowY: 'auto' }}>
              {divisionIds.length === 0 && <div style={{ color: '#888' }}>Пока не выбрано</div>}
              {divisionIds.map(id => {
                const d = divisions.find(x => x.id === id);
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                    <span>{d?.name || id}</span>
                    <button type="button" onClick={() => handleRemoveDivision(id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>Итого: {divisionIds.length} подразделени{divisionIds.length === 1 ? 'е' : (divisionIds.length >= 2 && divisionIds.length <= 4 ? 'я' : 'й')}</div>
          </div>

          {/* Вопросы */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 24 }}>Вопросы</h3>
              <button type="button" className="btn btn-add" onClick={handleAddAgenda} style={{ ...smallButton, background: '#2b8af8', color: '#fff' }}>
                <span>Добавить</span>
              </button>
            </div>
            <div style={{ height: 1, background: '#eaeaea', marginBottom: 12 }} />

            {agenda.map((item, idx) => (
              <div key={idx} style={{ borderTop: '1px solid #eaeaea', paddingTop: 16, marginTop: 16 }}>
                {/* Верхняя строка: номер + наименование + крестик */}
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', columnGap: 12, marginBottom: 10 }}>
                  <div style={{ width: 24, textAlign: 'right' }}>{idx + 1}.</div>
                  <input
                    placeholder="Вопрос внесения изменений в Устав"
                    style={{ ...inputStyle, width: '100%', minWidth: 0 }}
                    value={item.title}
                    onChange={(e) => handleAgendaChange(idx, { title: e.target.value })}
                  />
                  <button
                    type="button"
                    title="Удалить вопрос"
                    onClick={() => handleRemoveAgenda(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
                {/* Нижняя строка: Докладчик + Ссылка */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={item.speakerId ?? ''}
                    onChange={(e) => handleAgendaChange(idx, { speakerId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Докладчик</option>
                    {eligibleUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Ссылка"
                    style={{ ...inputStyle, flex: 1 }}
                    value={item.link}
                    onChange={(e) => handleAgendaChange(idx, { link: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Пароль + Применить */}
          <div style={{ display: 'flex', gap: 20, marginTop: 24, alignItems: 'center' }}>
            <input
              type="password"
              placeholder="Пароль"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" className="btn" style={{ ...smallButton, backgroundColor: '#2b8af8', color: '#fff', border: 'none' }}>Применить</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MeetingModal;
