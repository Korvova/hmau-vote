import React, { useEffect, useState } from 'react';
import './ModalHeader.css';
import { getDurationTemplates } from '../utils/api.js';

function TimerModal({ open, meetingId, onClose, onStart }) {
  const [durationTemplates, setDurationTemplates] = useState([]);
  const [durationTemplateId, setDurationTemplateId] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const templates = await getDurationTemplates();
        setDurationTemplates(Array.isArray(templates) ? templates : []);
      } catch (e) {
        console.error('Ошибка загрузки шаблонов времени:', e);
        setDurationTemplates([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (durationTemplateId) {
      const selected = durationTemplates.find((t) => String(t.id) === String(durationTemplateId));
      setDuration(selected ? String(selected.durationInSeconds) : '');
    }
  }, [durationTemplateId, durationTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!duration || parseInt(duration) <= 0) {
      alert('Укажите длительность таймера');
      return;
    }
    try {
      setLoading(true);
      await onStart(parseInt(duration));
      onClose();
    } catch (err) {
      alert(err.message || 'Не удалось запустить таймер');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  };

  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '32px',
    width: '500px',
    maxWidth: '90%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="modal-header">
          <span className="modal-header-spacer" aria-hidden="true" />
          <h2 className="modal-title">Запуск таймера</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Закрыть модальное окно"
            onClick={onClose}
          />
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Шаблон времени
            </label>
            <select
              value={durationTemplateId}
              onChange={(e) => setDurationTemplateId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #dcdcdc',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="">Не выбран</option>
              {durationTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Время (сек) *
            </label>
            <input
              type="number"
              required
              disabled={!!durationTemplateId}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #dcdcdc',
                backgroundColor: durationTemplateId ? '#f3f4f6' : '#fff',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2b8af8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Запустить
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#dcdcdc',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TimerModal;
