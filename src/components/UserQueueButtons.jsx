import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function UserQueueButtons({ meetingId, userId }) {
  const [questionQueue, setQuestionQueue] = useState([]);
  const [speechQueue, setSpeechQueue] = useState([]);
  const [questionQueueEnabled, setQuestionQueueEnabled] = useState(true);
  const [speechQueueEnabled, setSpeechQueueEnabled] = useState(true);

  // Microphone states
  const [questionMicEnabled, setQuestionMicEnabled] = useState(false);
  const [speechMicEnabled, setSpeechMicEnabled] = useState(false);
  const [hasTelevicLink, setHasTelevicLink] = useState(false); // Проверка привязки к Televic

  // Refs to track if we've already toggled mic for this timer session
  const questionMicToggledRef = useRef(false);
  const speechMicToggledRef = useRef(false);

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

  // Toggle microphone via Televic API
  const toggleMicrophone = async (action, type) => {
    try {
      console.log(`[Microphone] ${type}: ${action} for user ${userId}`);
      await axios.post('/api/televic/microphone/toggle', {
        userId,
        action // 'enable' or 'disable'
      });

      if (type === 'QUESTION') {
        setQuestionMicEnabled(action === 'enable');
      } else {
        setSpeechMicEnabled(action === 'enable');
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      // Don't show alert for auto-toggle, only log
    }
  };

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
    if (!meetingId || !userId) return;

    const loadMeetingSettings = async () => {
      try {
        const response = await axios.get(`/api/meetings/${meetingId}`);
        setQuestionQueueEnabled(response.data.questionQueueEnabled ?? true);
        setSpeechQueueEnabled(response.data.speechQueueEnabled ?? true);
      } catch (error) {
        console.error('Error loading meeting settings:', error);
      }
    };

    const checkTelevicLink = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setHasTelevicLink(!!response.data?.televicExternalId);
      } catch (error) {
        console.error('Error checking Televic link:', error);
        setHasTelevicLink(false);
      }
    };

    loadMeetingSettings();
    checkTelevicLink();
    loadQueue('QUESTION');
    loadQueue('SPEECH');
  }, [meetingId, userId]);

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

  // Auto-enable microphone when timer starts for QUESTION
  useEffect(() => {
    if (questionEntry?.status === 'ACTIVE' && questionEntry.timerEndTime && !questionMicToggledRef.current) {
      console.log('[Microphone] Auto-enabling for QUESTION timer start');
      questionMicToggledRef.current = true;
      toggleMicrophone('enable', 'QUESTION');
    }

    // Reset ref when no longer active
    if (!questionEntry || questionEntry.status !== 'ACTIVE') {
      questionMicToggledRef.current = false;
    }
  }, [questionEntry?.status, questionEntry?.timerEndTime]);

  // Auto-disable microphone when QUESTION timer ends (reaches 0)
  useEffect(() => {
    if (questionTimeLeft === 0 && questionMicEnabled) {
      console.log('[Microphone] Auto-disabling for QUESTION timer end');
      toggleMicrophone('disable', 'QUESTION');
    }
  }, [questionTimeLeft, questionMicEnabled]);

  // Auto-disable microphone when user exits QUESTION queue or is no longer active
  useEffect(() => {
    if (questionMicEnabled && (!questionEntry || questionEntry.status !== 'ACTIVE')) {
      console.log('[Microphone] Auto-disabling for QUESTION - user no longer active or left queue');
      toggleMicrophone('disable', 'QUESTION');
    }
  }, [questionEntry, questionMicEnabled]);

  // Auto-enable microphone when timer starts for SPEECH
  useEffect(() => {
    if (speechEntry?.status === 'ACTIVE' && speechEntry.timerEndTime && !speechMicToggledRef.current) {
      console.log('[Microphone] Auto-enabling for SPEECH timer start');
      speechMicToggledRef.current = true;
      toggleMicrophone('enable', 'SPEECH');
    }

    // Reset ref when no longer active
    if (!speechEntry || speechEntry.status !== 'ACTIVE') {
      speechMicToggledRef.current = false;
    }
  }, [speechEntry?.status, speechEntry?.timerEndTime]);

  // Auto-disable microphone when SPEECH timer ends (reaches 0)
  useEffect(() => {
    if (speechTimeLeft === 0 && speechMicEnabled) {
      console.log('[Microphone] Auto-disabling for SPEECH timer end');
      toggleMicrophone('disable', 'SPEECH');
    }
  }, [speechTimeLeft, speechMicEnabled]);

  // Auto-disable microphone when user exits SPEECH queue or is no longer active
  useEffect(() => {
    if (speechMicEnabled && (!speechEntry || speechEntry.status !== 'ACTIVE')) {
      console.log('[Microphone] Auto-disabling for SPEECH - user no longer active or left queue');
      toggleMicrophone('disable', 'SPEECH');
    }
  }, [speechEntry, speechMicEnabled]);

  // Join queue
  const handleJoinQueue = async (type) => {
    try {
      await axios.post(`/api/meetings/${meetingId}/queue/${type}`, { userId });
    } catch (error) {
      console.error('Error joining queue:', error);
      alert(error.response?.data?.error || 'Ошибка при встании в очередь');
    }
  };

  // Manual microphone toggle
  const handleMicToggle = async (type) => {
    const currentState = type === 'QUESTION' ? questionMicEnabled : speechMicEnabled;
    const newAction = currentState ? 'disable' : 'enable';
    await toggleMicrophone(newAction, type);
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Ваш вопрос</span>
              {questionTimeLeft !== null && (
                <span style={{ fontSize: '1.2rem' }}>
                  {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
                </span>
              )}
            </div>
            {hasTelevicLink && (
              <button
                onClick={() => handleMicToggle('QUESTION')}
                title={questionMicEnabled ? 'Выключить звук' : 'Включить звук'}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0px',
                  lineHeight: 1,
                  opacity: 1,
                }}
              >
                {questionMicEnabled ? '🔊' : '🔇'}
              </button>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Ваше выступление</span>
              {speechTimeLeft !== null && (
                <span style={{ fontSize: '1.2rem' }}>
                  {Math.floor(speechTimeLeft / 60)}:{String(speechTimeLeft % 60).padStart(2, '0')}
                </span>
              )}
            </div>
            {hasTelevicLink && (
              <button
                onClick={() => handleMicToggle('SPEECH')}
                title={speechMicEnabled ? 'Выключить звук' : 'Включить звук'}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0px',
                  lineHeight: 1,
                  opacity: 1,
                }}
              >
                {speechMicEnabled ? '🔊' : '🔇'}
              </button>
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
