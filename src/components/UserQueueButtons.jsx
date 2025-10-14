import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function UserQueueButtons({ meetingId, userId }) {
  const [questionQueue, setQuestionQueue] = useState([]);
  const [speechQueue, setSpeechQueue] = useState([]);
  const [questionQueueEnabled, setQuestionQueueEnabled] = useState(true);
  const [speechQueueEnabled, setSpeechQueueEnabled] = useState(true);

  // Find user's position in each queue
  const questionEntry = useMemo(() => {
    return questionQueue.find(entry => entry.userId === userId);
  }, [questionQueue, userId]);

  const speechEntry = useMemo(() => {
    return speechQueue.find(entry => entry.userId === userId);
  }, [speechQueue, userId]);

  // Calculate queue position (1-based)
  const questionPosition = useMemo(() => {
    if (!questionEntry) return null;
    if (questionEntry.status === 'ACTIVE') return 'active';
    const waitingBefore = questionQueue.filter(
      e => e.status === 'WAITING' && e.position < questionEntry.position
    ).length;
    return waitingBefore + 1;
  }, [questionQueue, questionEntry]);

  const speechPosition = useMemo(() => {
    if (!speechEntry) return null;
    if (speechEntry.status === 'ACTIVE') return 'active';
    const waitingBefore = speechQueue.filter(
      e => e.status === 'WAITING' && e.position < speechEntry.position
    ).length;
    return waitingBefore + 1;
  }, [speechQueue, speechEntry]);

  // Timer for active entry
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
  const [speechTimeLeft, setSpeechTimeLeft] = useState(null);

  // Load queues
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

  useEffect(() => {
    if (!meetingId) return;

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

    const socket = io();

    const handleQueueUpdated = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
    };

    const handleTimerStarted = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
    };

    const handleQueueNext = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      loadQueue(data.type);
    };

    const handleQueueSettingsUpdated = (data) => {
      if (data.meetingId !== parseInt(meetingId)) return;
      setQuestionQueueEnabled(data.questionQueueEnabled);
      setSpeechQueueEnabled(data.speechQueueEnabled);
    };

    socket.on('queue-updated', handleQueueUpdated);
    socket.on('queue-timer-started', handleTimerStarted);
    socket.on('queue-next', handleQueueNext);
    socket.on('queue-settings-updated', handleQueueSettingsUpdated);

    return () => {
      socket.off('queue-updated', handleQueueUpdated);
      socket.off('queue-timer-started', handleTimerStarted);
      socket.off('queue-next', handleQueueNext);
      socket.off('queue-settings-updated', handleQueueSettingsUpdated);
      socket.disconnect();
    };
  }, [meetingId]);

  // Timer countdown for question
  useEffect(() => {
    if (questionEntry?.status === 'ACTIVE' && questionEntry.timerEndTime) {
      const updateTimer = () => {
        const now = Date.now();
        const endMs = new Date(questionEntry.timerEndTime).getTime();
        const left = Math.max(0, Math.floor((endMs - now) / 1000));
        setQuestionTimeLeft(left);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setQuestionTimeLeft(null);
    }
  }, [questionEntry]);

  // Timer countdown for speech
  useEffect(() => {
    if (speechEntry?.status === 'ACTIVE' && speechEntry.timerEndTime) {
      const updateTimer = () => {
        const now = Date.now();
        const endMs = new Date(speechEntry.timerEndTime).getTime();
        const left = Math.max(0, Math.floor((endMs - now) / 1000));
        setSpeechTimeLeft(left);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setSpeechTimeLeft(null);
    }
  }, [speechEntry]);

  // Join queue
  const handleJoinQueue = async (type) => {
    try {
      await axios.post(`/api/meetings/${meetingId}/queue/${type}`, { userId });
    } catch (error) {
      console.error('Error joining queue:', error);
      alert(error.response?.data?.error || 'Ошибка при встании в очередь');
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Question button */}
      {questionQueueEnabled && (
        <div>
          {!questionEntry ? (
            <button
              onClick={() => handleJoinQueue('QUESTION')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              Вопрос
            </button>
          ) : questionPosition === 'active' ? (
          <div style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            Ваш вопрос
            {questionTimeLeft !== null && (
              <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>
                {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        ) : (
          <div style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ff9800',
            color: 'white',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            Ваш номер в очереди: {questionPosition}
          </div>
          )}
        </div>
      )}

      {/* Speech button */}
      {speechQueueEnabled && (
        <div>
          {!speechEntry ? (
            <button
              onClick={() => handleJoinQueue('SPEECH')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              Выступление
            </button>
          ) : speechPosition === 'active' ? (
          <div style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            Ваше выступление
            {speechTimeLeft !== null && (
              <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>
                {Math.floor(speechTimeLeft / 60)}:{String(speechTimeLeft % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        ) : (
          <div style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ff9800',
            color: 'white',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            Ваш номер в очереди: {speechPosition}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserQueueButtons;
