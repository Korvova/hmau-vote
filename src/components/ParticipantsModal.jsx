import React, { useEffect, useState } from 'react';
import './ModalHeader.css';
import { getMeetingParticipants, saveMeetingParticipants } from '../utils/api.js';

function ParticipantsModal({ open, meetingId, onClose }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !meetingId) return;

    const loadParticipants = async () => {
      setLoading(true);
      try {
        const data = await getMeetingParticipants(meetingId);
        setParticipants(data.participants || []);
      } catch (error) {
        console.error('Ошибка загрузки участников:', error);
        alert('Не удалось загрузить список участников');
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [open, meetingId]);

  const handleLocationChange = (userId, location) => {
    setParticipants(prev =>
      prev.map(p => p.id === userId ? { ...p, location } : p)
    );
  };

  const handleProxyChange = (fromUserId, toUserId) => {
    setParticipants(prev => {
      // Сначала обновляем proxy у fromUser
      const updated = prev.map(p => {
        if (p.id === fromUserId) {
          const toUser = prev.find(u => u.id === toUserId);
          return {
            ...p,
            proxy: toUserId ? { toUserId, toUserName: toUser?.name } : null
          };
        }
        return p;
      });

      // Пересчитываем receivedProxies и voteWeight для всех
      return updated.map(p => {
        const receivedProxies = updated
          .filter(other => other.proxy?.toUserId === p.id)
          .map(other => ({
            fromUserId: other.id,
            fromUserName: other.name
          }));

        return {
          ...p,
          receivedProxies,
          voteWeight: 1 + receivedProxies.length
        };
      });
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = participants.map(p => ({
        userId: p.id,
        location: p.location || 'SITE',
        proxyToUserId: p.proxy?.toUserId || null
      }));

      await saveMeetingParticipants(meetingId, payload);
      alert('Данные успешно сохранены');
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить данные');
    } finally {
      setSaving(false);
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
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    width: '95%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    fontSize: '14px',
    color: '#374151',
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px',
  };

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #dcdcdc',
    fontSize: '14px',
    minWidth: '150px',
  };

  // Получаем список доступных пользователей для передачи доверенности
  const getAvailableProxyUsers = (currentUserId) => {
    return participants.filter(p =>
      p.id !== currentUserId && !p.proxy // Нельзя передать тому, кто уже передал доверенность
    );
  };

  // Проверяем, передал ли пользователь доверенность
  const hasGivenProxy = (userId) => {
    return participants.some(p => p.proxy?.toUserId === userId);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div className="modal-header">
          <span className="modal-header-spacer" aria-hidden="true" />
          <h2 className="modal-title">Участники заседания ({participants.length})</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Закрыть"
            onClick={onClose}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
        ) : (
          <>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ФИО</th>
                  <th style={thStyle}>Группа</th>
                  <th style={thStyle}>Место</th>
                  <th style={thStyle}>Доверенность</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => {
                  const canChooseLocation = !participant.proxy; // Если передал доверенность - место disabled
                  const receivedFrom = participant.receivedProxies || [];

                  return (
                    <tr key={participant.id}>
                      <td style={tdStyle}>{participant.name}</td>
                      <td style={tdStyle}>
                        {participant.divisions.map(d => d.name).join(', ')}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: canChooseLocation ? 'pointer' : 'not-allowed', opacity: canChooseLocation ? 1 : 0.5 }}>
                            <input
                              type="radio"
                              name={`location-${participant.id}`}
                              value="SITE"
                              checked={participant.location === 'SITE'}
                              onChange={(e) => handleLocationChange(participant.id, e.target.value)}
                              disabled={!canChooseLocation}
                            />
                            Сайт
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: canChooseLocation ? 'pointer' : 'not-allowed', opacity: canChooseLocation ? 1 : 0.5 }}>
                            <input
                              type="radio"
                              name={`location-${participant.id}`}
                              value="HALL"
                              checked={participant.location === 'HALL'}
                              onChange={(e) => handleLocationChange(participant.id, e.target.value)}
                              disabled={!canChooseLocation}
                            />
                            Зал
                          </label>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {participant.proxy ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#dc2626' }}>
                              Передал → {participant.proxy.toUserName}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleProxyChange(participant.id, null)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '0 4px',
                                lineHeight: '1',
                                fontWeight: 'bold',
                              }}
                              title="Отменить передачу доверенности"
                            >
                              ×
                            </button>
                          </div>
                        ) : receivedFrom.length > 0 ? (
                          <div>
                            <span style={{ color: '#16a34a', fontWeight: 500 }}>
                              Получил от: {receivedFrom.map(r => r.fromUserName).join(', ')}
                            </span>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              Вес голоса: {participant.voteWeight}
                            </div>
                          </div>
                        ) : (
                          <select
                            style={selectStyle}
                            value={participant.proxy?.toUserId || ''}
                            onChange={(e) => handleProxyChange(participant.id, e.target.value ? Number(e.target.value) : null)}
                          >
                            <option value="">Не передавать</option>
                            {getAvailableProxyUsers(participant.id).map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #dcdcdc',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2b8af8',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ParticipantsModal;
