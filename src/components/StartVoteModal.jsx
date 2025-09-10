import React, { useEffect, useState } from 'react';
import '../App.css';
import { getVoteTemplates, getVoteProcedures, startVote } from '../utils/api.js';

function StartVoteModal({ open, agendaItemId, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [voteType, setVoteType] = useState('OPEN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [tmpl, proc] = await Promise.all([getVoteTemplates(), getVoteProcedures()]);
        setTemplates(Array.isArray(tmpl) ? tmpl : []);
        setProcedures(Array.isArray(proc) ? proc : []);
      } catch (e) {
        alert(e.message || 'Ошибка загрузки данных');
      }
    })();
  }, [open]);

  useEffect(() => {
    if (templateId) {
      const selected = templates.find((t) => String(t.id) === String(templateId));
      setQuestion(selected ? selected.title : '');
    } else {
      setQuestion('');
    }
  }, [templateId, templates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await startVote({
        agendaItemId,
        question,
        duration: Number(duration),
        procedureId: Number(procedureId),
        voteType,
      });
      alert('Голосование запущено');
      onClose(true);
    } catch (err) {
      alert(err.message || 'Не удалось запустить голосование');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Запуск голосования</h2>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Шаблон голосования
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
              >
                <option value="">Не выбран</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Вопрос голосования *
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required={!templateId}
                disabled={!!templateId}
                style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Время (сек) *
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Процедура подсчёта голосов
              <select
                value={procedureId}
                onChange={(e) => setProcedureId(e.target.value)}
                required
                style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
              >
                <option value="">Выберите процедуру</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Тип голосования
              <select
                value={voteType}
                onChange={(e) => setVoteType(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.5rem' }}
              >
                <option value="OPEN">Открытое</option>
                <option value="CLOSED">Закрытое</option>
              </select>
            </label>
          </div>

          <div className="modal-buttons" style={{ textAlign: 'right' }}>
            <button type="submit" className="btn" disabled={loading}>
              Запуск
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onClose(false)}
              style={{ marginLeft: '0.5rem' }}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StartVoteModal;