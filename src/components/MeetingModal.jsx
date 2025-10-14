import React, { useEffect, useMemo, useState } from 'react';
import './ModalHeader.css';
import ChipMultiSelect from './ChipMultiSelect.jsx';
import ParticipantsModal from './ParticipantsModal.jsx';
import { getVoteProcedures } from '../utils/api.js';

function MeetingModal({ open, data, divisions = [], users = [], title = 'Редактировать заседание', onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', startAt: '', endAt: '' });
  const [divisionIds, setDivisionIds] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [password, setPassword] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [voteProcedureId, setVoteProcedureId] = useState(null);
  const [voteProcedures, setVoteProcedures] = useState([]);
  const [quorumType, setQuorumType] = useState(null);
  const [createInTelevic, setCreateInTelevic] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = { title: data?.title || data?.name || '', startAt: '', endAt: '' };
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

    if (!next.startAt && typeof data?.startTime === 'string' && data.startTime.includes(' ')) {
      const [sd, st] = data.startTime.split(' ');
      next.startAt = `${sd}T${st}`;
    }
    if (!next.endAt && typeof data?.endTime === 'string' && data.endTime.includes(' ')) {
      const [ed, et] = data.endTime.split(' ');
      next.endAt = `${ed}T${et}`;
    }
    setForm(next);

    let ids = [];
    if (Array.isArray(data?.divisionIds)) {
      // Если передан массив divisionIds - используем его
      ids = data.divisionIds.slice();
    } else if (Array.isArray(data?.divisions)) {
      // Если divisions - массив объектов (из API)
      ids = data.divisions.map(d => d.id);
    } else if (typeof data?.divisions === 'string' && data.divisions.trim()) {
      // Если divisions - строка (старый формат)
      const names = data.divisions.split(',').map(s => s.trim()).filter(Boolean);
      ids = divisions.filter(d => names.includes(d.name)).map(d => d.id);
    }
    console.log('🔍 MeetingModal setDivisionIds:', ids);
    setDivisionIds(ids);

    const ag = Array.isArray(data?.agenda) ? data.agenda.map(a => ({
      title: a.title || '',
      speakerName: a.speakerName || '',
      link: a.link || '',
    })) : [];
    setAgenda(ag);
    setVoteProcedureId(data?.voteProcedureId || null);
    setQuorumType(data?.quorumType || null);
    setPassword('');
  }, [open, data, divisions]);

  // Загружаем процедуры голосования при открытии модального окна
  useEffect(() => {
    if (!open) return;
    const loadProcedures = async () => {
      try {
        const procedures = await getVoteProcedures();
        setVoteProcedures(Array.isArray(procedures) ? procedures : []);
      } catch (error) {
        console.error('Ошибка загрузки процедур голосования:', error);
        setVoteProcedures([]);
      }
    };
    loadProcedures();
  }, [open]);

  const selectedDivisionNames = useMemo(
    () => {
      if (!Array.isArray(divisions)) return [];
      return divisionIds.map(id => divisions.find(d => d.id === id)?.name).filter(Boolean);
    },
    [divisionIds, divisions]
  );

  const eligibleUsers = useMemo(() => {
    if (!selectedDivisionNames.length) return [];
    return (users || []).filter(u => selectedDivisionNames.includes(u.division));
  }, [users, selectedDivisionNames]);

  const divisionOptions = useMemo(
    () => {
      console.log('🔍 MeetingModal divisions:', divisions, 'isArray:', Array.isArray(divisions));
      if (!Array.isArray(divisions)) {
        console.warn('⚠️ divisions is not an array!', divisions);
        return [];
      }
      const options = divisions.map(d => ({ value: d.id, label: d.displayName || d.name }));
      console.log('🔍 MeetingModal divisionOptions:', options);
      return options;
    },
    [divisions]
  );

  // Подсчитываем участников из выбранных подразделений
  useEffect(() => {
    if (!divisionIds.length || !divisions.length) {
      setParticipantCount(0);
      return;
    }

    // Собираем всех уникальных пользователей из выбранных подразделений
    const selectedDivisions = divisions.filter(d => divisionIds.includes(d.id));
    const userIds = new Set();

    // Проходим по всем пользователям и проверяем их принадлежность к выбранным подразделениям
    users.forEach(user => {
      // Проверяем основное подразделение
      if (divisionIds.includes(user.divisionId)) {
        userIds.add(user.id);
      }
      // Проверяем дополнительные подразделения (если есть divisionIds массив)
      if (Array.isArray(user.divisionIds)) {
        user.divisionIds.forEach(dId => {
          if (divisionIds.includes(dId)) {
            userIds.add(user.id);
          }
        });
      }
    });

    setParticipantCount(userIds.size);
  }, [divisionIds, divisions, users]);

  const handleChange = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const handleAddAgenda = () => setAgenda(prev => [...prev, { title: '', speakerId: null, link: '' }]);
  const handleRemoveAgenda = (idx) => setAgenda(prev => prev.filter((_, i) => i !== idx));
  const handleAgendaChange = (idx, patch) => setAgenda(prev => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const [sd, st] = (form.startAt || '').split('T');
    const [ed, et] = (form.endAt || '').split('T');

    // Проверка 1: Время начала должно быть в будущем при создании заседания с Televic
    if (createInTelevic && form.startAt) {
      const startDateTime = new Date(form.startAt);
      const now = new Date();

      if (startDateTime <= now) {
        alert('⚠️ Внимание!\n\nПри создании заседания с Televic время начала должно быть в будущем.\n\nТекущее время: ' + now.toLocaleString('ru-RU') + '\nВыбранное время: ' + startDateTime.toLocaleString('ru-RU'));
        return;
      }
    }

    // Проверка 2: Предупреждение о завершении активных заседаний в Televic
    if (createInTelevic && !data?.id) {
      const confirmed = confirm(
        '⚠️ ВНИМАНИЕ!\n\n' +
        'При создании заседания с Televic все активные заседания в CoCon будут автоматически завершены.\n\n' +
        'Продолжить?'
      );

      if (!confirmed) {
        return;
      }
    }

    const payload = {
      title: form.title,
      startDate: sd || '',
      startTime: st || '',
      endDate: ed || '',
      endTime: et || '',
      divisions: selectedDivisionNames.join(', '),
      divisionIds: divisionIds.slice(),
      agenda: agenda.map((a, idx) => ({ number: idx + 1, ...a })),
      voteProcedureId: voteProcedureId,
      quorumType: quorumType,
      createInTelevic: createInTelevic,
    };
    onSubmit?.(payload, password);
  };

  const handleSaveAndConfigureParticipants = async (e) => {
    e?.preventDefault?.();
    const [sd, st] = (form.startAt || '').split('T');
    const [ed, et] = (form.endAt || '').split('T');

    // Проверка 1: Время начала должно быть в будущем при создании заседания с Televic
    if (createInTelevic && form.startAt) {
      const startDateTime = new Date(form.startAt);
      const now = new Date();

      if (startDateTime <= now) {
        alert('⚠️ Внимание!\n\nПри создании заседания с Televic время начала должно быть в будущем.\n\nТекущее время: ' + now.toLocaleString('ru-RU') + '\nВыбранное время: ' + startDateTime.toLocaleString('ru-RU'));
        return;
      }
    }

    // Проверка 2: Предупреждение о завершении активных заседаний в Televic
    if (createInTelevic && !data?.id) {
      const confirmed = confirm(
        '⚠️ ВНИМАНИЕ!\n\n' +
        'При создании заседания с Televic все активные заседания в CoCon будут автоматически завершены.\n\n' +
        'Продолжить?'
      );

      if (!confirmed) {
        return;
      }
    }

    const payload = {
      title: form.title,
      startDate: sd || '',
      startTime: st || '',
      endDate: ed || '',
      endTime: et || '',
      divisions: selectedDivisionNames.join(', '),
      divisionIds: divisionIds.slice(),
      agenda: agenda.map((a, idx) => ({ number: idx + 1, ...a })),
      voteProcedureId: voteProcedureId,
      quorumType: quorumType,
      createInTelevic: createInTelevic,
      openParticipantsAfterSave: true, // Флаг для родителя
    };
    onSubmit?.(payload, password);
  };

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999,
    overflowY: 'auto',
  };
  const modalStyle = {
    backgroundColor: '#fff', borderRadius: 12, padding: 32, width: 820, maxWidth: '95%',
    maxHeight: '80vh', overflowY: 'auto',
  };
  const labelStyle = { display: 'block', marginBottom: 8, fontSize: 14 };
  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6' };
  const rowStyle = { display: 'flex', gap: 20 };
  const smallButton = { padding: '0 16px', height: 44, width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="modal-header">
          <span className="modal-header-spacer" aria-hidden="true" />
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Закрыть модальное окно"
            onClick={onClose}
          />
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
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

          {/* Подразделения */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Участвующие подразделения</label>
            <ChipMultiSelect
              options={divisionOptions}
              value={divisionIds}
              onChange={setDivisionIds}
              placeholder="Выберите подразделения…"
            />
            {divisionIds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  marginBottom: 8
                }}>
                  Участников: {participantCount}
                </div>
                {data?.id ? (
                  <button
                    type="button"
                    onClick={() => setShowParticipants(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #2b8af8',
                      backgroundColor: '#fff',
                      color: '#2b8af8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Настроить участников
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAndConfigureParticipants}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2b8af8',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Сохранить и настроить участников
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Условие голосования */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Условие голосования</label>
            <select
              style={inputStyle}
              value={voteProcedureId || ''}
              onChange={(e) => setVoteProcedureId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Не выбрано</option>
              {voteProcedures.map(proc => (
                <option key={proc.id} value={proc.id}>
                  {proc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Кворум */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Кворум</label>
            <select
              style={inputStyle}
              value={quorumType || ''}
              onChange={(e) => setQuorumType(e.target.value || null)}
            >
              <option value="">Не выбрано</option>
              <option value="MORE_THAN_ONE">Больше 1</option>
              <option value="TWO_THIRDS_OF_TOTAL">2/3 от установленного</option>
              <option value="HALF_PLUS_ONE">Половина +1</option>
            </select>
          </div>

          {/* Создать в Televic */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={createInTelevic}
                onChange={(e) => setCreateInTelevic(e.target.checked)}
                style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500 }}>Сайт + Televic</span>
              <span className="televic-badge" title="Создать зеркальное заседание в Televic CoCon" style={{ marginLeft: 8 }}>T</span>
            </label>
            {createInTelevic && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280', paddingLeft: 26 }}>
                Заседание будет создано в Televic CoCon с режимом "Free seating + badge"
              </div>
            )}
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
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 32px', alignItems: 'center', columnGap: 12, marginBottom: 10 }}>
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
                    style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#6b7280', justifySelf: 'end', marginTop: 0, padding: 0 }}
                  >
                    ×
                  </button>
                </div>
                {/* Нижняя строка: Докладчик + Ссылка */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
                  <input
                    placeholder="ФИО докладчика"
                    style={{ ...inputStyle, width: '100%' }}
                    value={item.speakerName || ''}
                    onChange={(e) => handleAgendaChange(idx, { speakerName: e.target.value })}
                  />
                  <input
                    placeholder="Ссылка"
                    style={{ ...inputStyle, width: '100%' }}
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

      <ParticipantsModal
        open={showParticipants}
        meetingId={data?.id}
        onClose={() => setShowParticipants(false)}
      />
    </div>
  );
}

export default MeetingModal;
