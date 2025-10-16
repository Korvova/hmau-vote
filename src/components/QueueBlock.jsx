import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import socket from '../utils/socket.js';

function QueueBlock({ meetingId, durationTemplates }) {
  const [activeTab, setActiveTab] = useState('QUESTION'); // 'QUESTION' | 'SPEECH'
  const [questionQueue, setQuestionQueue] = useState([]);
  const [speechQueue, setSpeechQueue] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(60); // Default 60 seconds
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const [questionQueueEnabled, setQuestionQueueEnabled] = useState(true);
  const [speechQueueEnabled, setSpeechQueueEnabled] = useState(true);

  // Get current queue based on active tab
  const currentQueue = activeTab === 'QUESTION' ? questionQueue : speechQueue;
  const setCurrentQueue = activeTab === 'QUESTION' ? setQuestionQueue : setSpeechQueue;

  // First in queue (either ACTIVE or first WAITING)
  const firstEntry = useMemo(() => {
    // First check if there's an ACTIVE entry
    const active = currentQueue.find(entry => entry.status === 'ACTIVE');
    if (active) return active;

    // Otherwise get first WAITING entry
    const waiting = currentQueue
      .filter(entry => entry.status === 'WAITING')
      .sort((a, b) => a.position - b.position)[0];
    return waiting || null;
  }, [currentQueue]);

  // Waiting entries (excluding the first one shown above)
  const waitingEntries = useMemo(() => {
    return currentQueue
      .filter(entry => entry.status === 'WAITING' && entry.id !== firstEntry?.id)
      .sort((a, b) => a.position - b.position);
  }, [currentQueue, firstEntry]);

  // Load queue
  const loadQueue = async (type) => {
    try {
      const response = await axios.get(`/api/meetings/${meetingId}/queue/${type}`);
      if (type === 'QUESTION') {
        setQuestionQueue(response.data);
      } else {
        setSpeechQueue(response.data);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  // Load meeting settings and queues on mount
  useEffect(() => {
    const loadMeetingSettings = async () => {
      try {
        const response = await axios.get(`/api/meetings/${meetingId}`);
        setQuestionQueueEnabled(response.data.questionQueueEnabled ?? true);
        setSpeechQueueEnabled(response.data.speechQueueEnabled ?? true);
      } catch (error) {
        console.error('Error loading meeting settings:', error);
      }
    };

    loadMeetingSettings();
    loadQueue('QUESTION');
    loadQueue('SPEECH');
  }, [meetingId]);

  // Socket.io listeners
  useEffect(() => {
    if (!meetingId) return;

    const handleQueueUpdated = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
    };

    const handleTimerStarted = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
      if (data.type === activeTab) {
        setTimerEndTime(data.timerEndTime);
      }
    };

    const handleQueueNext = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
      setTimerEndTime(null);
      setTimeLeft(null);
    };

    const handleTimerEnded = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
      if (data.type === activeTab) {
        setTimerEndTime(null);
        setTimeLeft(null);
      }
    };

    const handleQueueSettingsUpdated = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      setQuestionQueueEnabled(data.questionQueueEnabled);
      setSpeechQueueEnabled(data.speechQueueEnabled);
    };

    socket.on('queue-updated', handleQueueUpdated);
    socket.on('queue-timer-started', handleTimerStarted);
    socket.on('queue-next', handleQueueNext);
    socket.on('queue-timer-ended', handleTimerEnded);
    socket.on('queue-settings-updated', handleQueueSettingsUpdated);

    return () => {
      socket.off('queue-updated', handleQueueUpdated);
      socket.off('queue-timer-started', handleTimerStarted);
      socket.off('queue-next', handleQueueNext);
      socket.off('queue-timer-ended', handleTimerEnded);
      socket.off('queue-settings-updated', handleQueueSettingsUpdated);
    };
  }, [meetingId]); // Removed activeTab - socket doesn't need to reconnect when tab changes

  // Timer countdown
  useEffect(() => {
    if (!timerEndTime) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = async () => {
      const now = Date.now();
      const endMs = new Date(timerEndTime).getTime();
      const left = Math.max(0, Math.floor((endMs - now) / 1000));
      setTimeLeft(left);

      if (left <= 0) {
        setTimerEndTime(null);
        // Call API to reset status to WAITING
        if (firstEntry && firstEntry.status === 'ACTIVE') {
          try {
            await axios.put(`/api/meetings/${meetingId}/queue/end-timer`, {
              type: activeTab,
              userId: firstEntry.userId,
            });
          } catch (error) {
            console.error('Error ending timer:', error);
          }
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerEndTime, meetingId, activeTab, firstEntry]);

  // Restore timer if first entry exists and is active
  useEffect(() => {
    if (firstEntry?.status === 'ACTIVE' && firstEntry.timerEndTime) {
      setTimerEndTime(firstEntry.timerEndTime);
    } else {
      setTimerEndTime(null);
      setTimeLeft(null);
    }
  }, [firstEntry]);

  // Handle start timer
  const handleStart = async () => {
    try {
      await axios.put(`/api/meetings/${meetingId}/queue/start`, {
        type: activeTab,
        timerSeconds: selectedDuration,
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      alert(error.response?.data?.error || 'Ошибка запуска');
    }
  };

  // Handle next
  const handleNext = async () => {
    try {
      await axios.put(`/api/meetings/${meetingId}/queue/next`, {
        type: activeTab,
      });
    } catch (error) {
      console.error('Error moving to next:', error);
      alert(error.response?.data?.error || 'Ошибка перехода');
    }
  };

  // Handle remove from queue
  const handleRemove = async (userId) => {
    if (!window.confirm('Удалить из очереди?')) return;
    try {
      await axios.delete(`/api/meetings/${meetingId}/queue/${userId}/${activeTab}`);
    } catch (error) {
      console.error('Error removing from queue:', error);
      alert(error.response?.data?.error || 'Ошибка удаления');
    }
  };

  // Toggle mute
  const handleToggleMute = (user) => {
    // This is placeholder - actual mute logic would go here
    console.log('Toggle mute for', user.name);
  };

  // Toggle queue enabled
  const handleToggleQueueEnabled = async (type, enabled) => {
    try {
      const field = type === 'QUESTION' ? 'questionQueueEnabled' : 'speechQueueEnabled';
      await axios.put(`/api/meetings/${meetingId}/queue-settings`, {
        [field]: enabled
      });

      if (type === 'QUESTION') {
        setQuestionQueueEnabled(enabled);
      } else {
        setSpeechQueueEnabled(enabled);
      }
    } catch (error) {
      console.error('Error toggling queue:', error);
      alert(error.response?.data?.error || 'Ошибка обновления настроек');
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>Очередь</h2>

      {/* Tabs with checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('QUESTION')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'QUESTION' ? '#1a73e8' : '#e8eaf6',
              color: activeTab === 'QUESTION' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'QUESTION' ? 'bold' : 'normal',
            }}
          >
            Вопрос
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!questionQueueEnabled}
              onChange={(e) => handleToggleQueueEnabled('QUESTION', !e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem' }}>откл</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('SPEECH')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'SPEECH' ? '#1a73e8' : '#e8eaf6',
              color: activeTab === 'SPEECH' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === 'SPEECH' ? 'bold' : 'normal',
            }}
          >
            Выступление
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!speechQueueEnabled}
              onChange={(e) => handleToggleQueueEnabled('SPEECH', !e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem' }}>откл</span>
          </label>
        </div>
      </div>

      {/* First in queue (active or waiting) */}
      {firstEntry && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: firstEntry.status === 'ACTIVE' ? '#e0f7fa' : '#fff3e0',
          borderRadius: '4px',
          border: firstEntry.status === 'ACTIVE' ? '1px solid #00acc1' : '1px solid #ff9800'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            {firstEntry.user.name}
            {firstEntry.status === 'WAITING' && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#ff9800' }}>
                (Готов к запуску)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={{ marginRight: '0.5rem' }}>Таймер (сек):</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {durationTemplates?.map(t => (
                  <option key={t.id} value={t.durationInSeconds}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            {timeLeft !== null && (
              <div style={{ fontWeight: 'bold', color: timeLeft <= 10 ? '#d32f2f' : '#333' }}>
                Осталось: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleStart}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Запустить
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Следующий
            </button>
          </div>
        </div>
      )}

      {/* Queue list */}
      <div className="participants-table-wrapper">
        <div className="page__table">
          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Статус</th>
                <th style={{ width: '50px', textAlign: 'center' }}>Звук</th>
                <th style={{ width: '50px', textAlign: 'center' }}>Действие</th>
              </tr>
            </thead>
            <tbody>
              {waitingEntries.length === 0 && !firstEntry && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>
                    Очередь пуста
                  </td>
                </tr>
              )}
              {waitingEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.user.name}</td>
                  <td className={`state state-${entry.user.isOnline ? 'on' : 'off'}`}>
                    <span />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleMute(entry.user)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '0',
                        lineHeight: '1',
                      }}
                      title="Звук"
                    >
                      🔇
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(entry.userId)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '0',
                        lineHeight: '1',
                        color: '#d32f2f',
                      }}
                      title="Удалить из очереди"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default QueueBlock;
