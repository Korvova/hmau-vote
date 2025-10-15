import React, { useEffect, useState } from 'react';
import './ModalHeader.css';
import { getVoteTemplates, getVoteProcedures, getDurationTemplates, startVote } from '../utils/api.js';

function StartVoteModal({ open, agendaItemId, defaultProcedureId, onClose, onStarted }) {
  const [templates, setTemplates] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [durationTemplates, setDurationTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState('');
  const [durationTemplateId, setDurationTemplateId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [voteType, setVoteType] = useState('OPEN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [tmpl, proc, durTmpl] = await Promise.all([
          getVoteTemplates(),
          getVoteProcedures(),
          getDurationTemplates()
        ]);
        setTemplates(Array.isArray(tmpl) ? tmpl : []);
        setProcedures(Array.isArray(proc) ? proc : []);
        setDurationTemplates(Array.isArray(durTmpl) ? durTmpl : []);
        // Set default procedure from meeting if provided
        if (defaultProcedureId) {
          setProcedureId(String(defaultProcedureId));
        }
      } catch (e) {
        alert(e.message || 'Ошибка загрузки данных');
      }
    })();
  }, [open, defaultProcedureId]);

  useEffect(() => {
    if (templateId) {
      const selected = templates.find((t) => String(t.id) === String(templateId));
      setQuestion(selected ? selected.title : '');
    } else {
      setQuestion('');
    }
  }, [templateId, templates]);

  useEffect(() => {
    if (durationTemplateId) {
      const selected = durationTemplates.find((t) => String(t.id) === String(durationTemplateId));
      setDuration(selected ? String(selected.duration) : '');
    }
  }, [durationTemplateId, durationTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await startVote({
        agendaItemId,
        question,
        duration: Number(duration) || null,
        durationTemplateId: durationTemplateId ? Number(durationTemplateId) : null,
        procedureId: Number(procedureId),
        voteType,
      });
      alert('Голосование запущено');
      onStarted?.(agendaItemId);
      onClose(true);
    } catch (err) {
      alert(err.message || 'Не удалось запустить голосование');
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
    width: '600px',
    maxWidth: '90%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  };

  const fields = [
    {
      name: 'templateId',
      label: 'Шаблон голосования',
      type: 'select',
      options: [{ value: '', label: 'Не выбран' }, ...templates.map((t) => ({ value: t.id, label: t.title }))],
      required: false,
    },
    {
      name: 'question',
      label: 'Вопрос голосования',
      type: 'text',
      required: !templateId,
      disabled: !!templateId,
    },
    {
      name: 'durationTemplateId',
      label: 'Шаблон времени',
      type: 'select',
      options: [{ value: '', label: 'Не выбран' }, ...durationTemplates.map((t) => ({ value: t.id, label: t.name }))],
      required: false,
    },
    {
      name: 'duration',
      label: 'Время (сек)',
      type: 'number',
      required: true,
      disabled: !!durationTemplateId,
    },
    {
      name: 'procedureId',
      label: 'Процедура подсчёта голосов',
      type: 'select',
      options: [{ value: '', label: 'Выберите процедуру' }, ...procedures.map((p) => ({ value: p.id, label: p.name }))],
      required: true,
      disabled: false,
    },
    {
      name: 'voteType',
      label: 'Тип голосования',
      type: 'select',
      options: [
        { value: 'OPEN', label: 'Открытое' },
        { value: 'CLOSED', label: 'Закрытое' },
      ],
      required: false,
    },
  ];

  const groupedFields = [];
  for (let i = 0; i < fields.length; ) {
    if (i === 0) {
      groupedFields.push([fields[i]]);
      i += 1;
    } else {
      groupedFields.push([fields[i], fields[i + 1]].filter(Boolean));
      i += 2;
    }
  }

  const handleChange = (fieldName, value) => {
    if (fieldName === 'templateId') setTemplateId(value);
    if (fieldName === 'question') setQuestion(value);
    if (fieldName === 'durationTemplateId') setDurationTemplateId(value);
    if (fieldName === 'duration') setDuration(value);
    if (fieldName === 'procedureId') setProcedureId(value);
    if (fieldName === 'voteType') setVoteType(value);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="modal-header">
          <span className="modal-header-spacer" aria-hidden="true" />
          <h2 className="modal-title">Запуск голосования</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Закрыть модальное окно"
            onClick={() => onClose(false)}
          />
        </div>
        <form onSubmit={handleSubmit}>
          {groupedFields.map((group, idx) => (
            group.length === 1 ? (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  {group[0].label}
                  {group[0].required && <sup>*</sup>}
                </label>
                {group[0].type === 'select' ? (
                  <select
                    name={group[0].name}
                    required={group[0].required}
                    disabled={group[0].disabled}
                    value={
                      group[0].name === 'templateId'
                        ? templateId
                        : group[0].name === 'procedureId'
                        ? procedureId
                        : voteType
                    }
                    onChange={(e) => handleChange(group[0].name, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #dcdcdc',
                      backgroundColor: group[0].disabled ? '#f3f4f6' : '#fff',
                      cursor: group[0].disabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {group[0].options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={group[0].type}
                    name={group[0].name}
                    required={group[0].required}
                    disabled={group[0].disabled}
                    value={
                      group[0].name === 'question' ? question :
                      group[0].name === 'duration' ? duration : ''
                    }
                    onChange={(e) => handleChange(group[0].name, e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}
                  />
                )}
              </div>
            ) : (
              <div key={idx} style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                {group.map((field) => (
                  <div key={field.name} style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      {field.label}
                      {field.required && <sup>*</sup>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        required={field.required}
                        disabled={field.disabled}
                        value={
                          field.name === 'templateId' ? templateId :
                          field.name === 'durationTemplateId' ? durationTemplateId :
                          field.name === 'procedureId' ? procedureId :
                          voteType
                        }
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #dcdcdc',
                          backgroundColor: field.disabled ? '#f3f4f6' : '#fff',
                          cursor: field.disabled ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        required={field.required}
                        disabled={field.disabled}
                        value={
                          field.name === 'question' ? question :
                          field.name === 'duration' ? duration : ''
                        }
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          ))}
          <div style={{ display: 'flex', gap: '20px', marginTop: '24px', alignItems: 'center' }}>
            <button
              type="submit"
              className="btn btn-big"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2b8af8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Запуск
            </button>
            <button
              type="button"
              className="btn btn-big"
              onClick={() => onClose(false)}
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

export default StartVoteModal;