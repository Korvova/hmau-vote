import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../utils/socket.js';
import { getMeeting, getVoteResults, getAgendaItems, getMeetingParticipants } from '../utils/api.js';

function MeetingScreenPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [vote, setVote] = useState(null);
  const [screenConfig, setScreenConfig] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [speechQueue, setSpeechQueue] = useState([]);
  const [timerTick, setTimerTick] = useState(0); // Force re-render every second for timer
  const [hiddenVoteIds, setHiddenVoteIds] = useState(new Set()); // Track hidden votes
  const [meetingTimer, setMeetingTimer] = useState(null); // Independent meeting timer

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        // Load global screen configs
        const [regConfigRes, agendaConfigRes, votingConfigRes, finalConfigRes] = await Promise.all([
          fetch('/api/screen-configs/REGISTRATION'),
          fetch('/api/screen-configs/AGENDA'),
          fetch('/api/screen-configs/VOTING'),
          fetch('/api/screen-configs/FINAL'),
        ]);
        const regData = await regConfigRes.json();
        const agendaData = await agendaConfigRes.json();
        const votingData = await votingConfigRes.json();
        const finalData = await finalConfigRes.json();

        const [m, agenda, parts] = await Promise.all([
          getMeeting(id),
          getAgendaItems(id).catch(() => []),
          getMeetingParticipants(id).catch(() => []),
        ]);
        setMeeting(
          m
            ? { ...m, agendaItems: Array.isArray(agenda) && agenda.length ? agenda : m.agendaItems || [] }
            : null,
        );
        setScreenConfig({
          registration: regData?.config || {},
          agenda: agendaData?.config || {},
          voting: votingData?.config || {},
          final: finalData?.config || {},
        });
        setParticipants(Array.isArray(parts?.participants) ? parts.participants : []);

        // Load initial timer state if active
        console.log('📊 Meeting data loaded:', { timerActive: m?.timerActive, timerDuration: m?.timerDuration, timerStartedAt: m?.timerStartedAt });
        if (m?.timerActive && m?.timerDuration && m?.timerStartedAt) {
          console.log('✅ Loading initial timer state');
          setMeetingTimer({
            duration: m.timerDuration,
            startedAt: new Date(m.timerStartedAt),
          });
        }

        // Load queues
        try {
          const [qQueue, sQueue] = await Promise.all([
            fetch(`/api/meetings/${id}/queue/QUESTION`).then(r => r.json()).catch(() => []),
            fetch(`/api/meetings/${id}/queue/SPEECH`).then(r => r.json()).catch(() => []),
          ]);
          setQuestionQueue(Array.isArray(qQueue) ? qQueue : []);
          setSpeechQueue(Array.isArray(sQueue) ? sQueue : []);
        } catch {}

        try {
          const results = await getVoteResults(id);
          if (Array.isArray(results)) {
            // First check for active PENDING vote
            const pending = results.find((r) => r.voteStatus === 'PENDING');
            if (pending) {
              setVote(pending);
              setMeeting((prev) => {
                if (!prev) return prev;
                const items = Array.isArray(prev.agendaItems)
                  ? prev.agendaItems.map((item) =>
                      item.id === pending.agendaItemId
                        ? { ...item, activeIssue: true }
                        : { ...item, activeIssue: false }
                    )
                  : [];
                return { ...prev, agendaItems: items };
              });
            } else if (m?.showVoteOnBroadcast) {
              // If no pending vote but trigger is ON, show most recent vote
              const recentVote = results.find((r) =>
                r.voteStatus === 'ENDED' || r.voteStatus === 'APPLIED'
              );
              if (recentVote) {
                setVote(recentVote);
              }
            }
          }
        } catch {}
      } catch {}
    })();
  }, [id]);

  // Polling: Auto-refresh agenda items and vote results every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [m, agenda, qQueue, sQueue, parts, voteResults] = await Promise.all([
          getMeeting(id).catch(() => null),
          getAgendaItems(id).catch(() => []),
          fetch(`/api/meetings/${id}/queue/QUESTION`).then(r => r.json()).catch(() => []),
          fetch(`/api/meetings/${id}/queue/SPEECH`).then(r => r.json()).catch(() => []),
          getMeetingParticipants(id).catch(() => []),
          getVoteResults(id).catch(() => []),
        ]);

        setMeeting((prev) => ({
          ...(prev || {}),
          ...m,
          agendaItems: Array.isArray(agenda) && agenda.length ? agenda : prev?.agendaItems || []
        }));
        setQuestionQueue(Array.isArray(qQueue) ? qQueue : []);
        setSpeechQueue(Array.isArray(sQueue) ? sQueue : []);
        setParticipants(Array.isArray(parts?.participants) ? parts.participants : []);

        // NEW LOGIC: Check Meeting.showVoteOnBroadcast as single source of truth
        if (Array.isArray(voteResults)) {
          // First priority: PENDING vote (active voting in progress)
          const pendingVote = voteResults.find((r) => r.voteStatus === 'PENDING');
          if (pendingVote) {
            setVote(pendingVote);
          } else if (m?.showVoteOnBroadcast) {
            // Second priority: Check global trigger - if ON, show most recent vote
            const recentVote = voteResults.find((r) =>
              r.voteStatus === 'ENDED' || r.voteStatus === 'APPLIED'
            );
            if (recentVote) {
              setVote(recentVote);
            } else {
              // Trigger is ON but no vote found - clear display
              setVote(null);
            }
          } else {
            // No pending vote and trigger is OFF - show current agenda
            setVote(null);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Every 3 seconds

    return () => clearInterval(interval);
  }, [id]);

  // Timer tick: Force re-render every second to update timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 1000); // Every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Connect socket lazily (only when needed)
    if (!socket.connected) {
      socket.connect();
    }

    const strId = String(id);
    const processedEvents = new Set();

    const handleNewVote = (data) => {
      if (String(data.meetingId) !== strId) return;
      const eventKey = `new-vote-${data?.id}-${data?.agendaItemId}`;
      if (processedEvents.has(eventKey)) return;
      processedEvents.add(eventKey);
      setTimeout(() => processedEvents.delete(eventKey), 5000);

      // Clear hidden votes list when new vote starts
      setHiddenVoteIds(new Set());
      setVote(data);
      setMeeting((prev) => {
        if (!prev) return prev;
        const items = Array.isArray(prev.agendaItems)
          ? prev.agendaItems.map((item) =>
              item.id === data.agendaItemId
                ? { ...item, activeIssue: true }
                : { ...item, activeIssue: false }
            )
          : [];
        return { ...prev, agendaItems: items };
      });
    };

    const handleVoteEnded = (data) => {
      if (String(data.meetingId) !== strId) return;
      const eventKey = `vote-ended-${data?.id}`;
      if (processedEvents.has(eventKey)) return;
      processedEvents.add(eventKey);
      setTimeout(() => processedEvents.delete(eventKey), 5000);

      setVote(data);
    };

    const clearVote = (data) => {
      if (String(data.meetingId) !== strId) return;
      const eventKey = `clear-vote-${data?.id}`;
      if (processedEvents.has(eventKey)) return;
      processedEvents.add(eventKey);
      setTimeout(() => processedEvents.delete(eventKey), 5000);

      setVote(null);
      setMeeting((prev) => {
        if (!prev) return prev;
        const items = Array.isArray(prev.agendaItems)
          ? prev.agendaItems.map((item) => ({ ...item, activeIssue: false }))
          : [];
        return { ...prev, agendaItems: items };
      });
    };

    // DEPRECATED: hideVoteBroadcast - now controlled by Meeting.currentVoteResultId
    // Keeping for backward compatibility but it won't be used
    const hideVoteBroadcast = (data) => {
      if (String(data.meetingId) !== strId) return;
      // This is now handled by meeting-current-vote-updated event
      console.log('hideVoteBroadcast deprecated - use meeting-current-vote-updated');
    };

    const handleAgendaUpdate = async (data) => {
      if (String(data.meetingId) !== strId) return;
      const eventKey = `agenda-update-${data?.id}-${data?.activeIssue}-${data?.completed}`;
      if (processedEvents.has(eventKey)) return;
      processedEvents.add(eventKey);
      setTimeout(() => processedEvents.delete(eventKey), 5000);

      // NOTE: Vote clearing is now controlled only by Meeting.currentVoteResultId
      // Don't clear vote here - it will be cleared by meeting-current-vote-updated event

      // Reload full agenda to get the latest active item with all details
      try {
        const agenda = await getAgendaItems(id);
        setMeeting((prev) => ({
          ...(prev || {}),
          agendaItems: Array.isArray(agenda) && agenda.length ? agenda : prev?.agendaItems || []
        }));
      } catch (err) {
        console.error('Failed to reload agenda:', err);
        // Fallback to just updating the local state
        setMeeting((prev) => {
          const items = Array.isArray(prev?.agendaItems) ? prev.agendaItems.map((item) =>
            item.id === data.id
              ? { ...item, activeIssue: data.activeIssue, completed: data.completed }
              : { ...item, activeIssue: false }
          ) : [];
          return { ...(prev || {}), agendaItems: items };
        });
      }
    };

    const handleMeetingStatus = (data) => {
      if (String(data.id) !== strId) return;
      const eventKey = `meeting-status-${data?.id}-${data?.status}`;
      if (processedEvents.has(eventKey)) return;
      processedEvents.add(eventKey);
      setTimeout(() => processedEvents.delete(eventKey), 5000);

      setMeeting((prev) => (prev ? { ...prev, status: data.status } : prev));
      if (data.status === 'COMPLETED') setVote(null);
    };

    const handleParticipantStatusChange = (data) => {
      if (String(data.meetingId) !== strId && !data.userId) return;
      getMeetingParticipants(id).then(parts => {
        setParticipants(Array.isArray(parts?.participants) ? parts.participants : []);
      }).catch(() => {});
    };

    const handleQueueUpdate = (data) => {
      if (String(data.meetingId) !== strId) return;
      // Reload queues
      Promise.all([
        fetch(`/api/meetings/${id}/queue/QUESTION`).then(r => r.json()).catch(() => []),
        fetch(`/api/meetings/${id}/queue/SPEECH`).then(r => r.json()).catch(() => []),
      ]).then(([qQueue, sQueue]) => {
        setQuestionQueue(Array.isArray(qQueue) ? qQueue : []);
        setSpeechQueue(Array.isArray(sQueue) ? sQueue : []);
      });
    };

    const handleMeetingShowVoteUpdated = async (data) => {
      if (String(data.meetingId) !== strId) return;
      const eventKey = `meeting-show-vote-${data?.showVoteOnBroadcast}`;
      if (processedEvents.has(eventKey)) return;
      processedEvents.add(eventKey);
      setTimeout(() => processedEvents.delete(eventKey), 5000);

      // Update meeting state with new showVoteOnBroadcast
      setMeeting((prev) => (prev ? { ...prev, showVoteOnBroadcast: data.showVoteOnBroadcast } : prev));

      // If turned OFF (false), hide vote and show agenda
      if (data.showVoteOnBroadcast === false) {
        setVote(null);
      } else {
        // If turned ON (true), load and show most recent vote
        try {
          const results = await getVoteResults(id);
          const recentVote = Array.isArray(results) ? results.find(r =>
            r.voteStatus === 'ENDED' || r.voteStatus === 'APPLIED'
          ) : null;
          if (recentVote) {
            setVote(recentVote);
          } else {
            setVote(null);
          }
        } catch (err) {
          console.error('Failed to load vote result:', err);
        }
      }
    };

    const handleTimerStarted = (data) => {
      console.log('🔔 Timer started event received:', data, 'Current meeting ID:', id);
      if (data.meetingId === parseInt(id)) {
        console.log('✅ Setting meeting timer:', { duration: data.duration, startedAt: data.startedAt });
        setMeetingTimer({
          duration: data.duration,
          startedAt: new Date(data.startedAt),
        });
      }
    };

    const handleTimerStopped = (data) => {
      console.log('🔔 Timer stopped event received:', data);
      if (data.meetingId === parseInt(id)) {
        console.log('✅ Clearing meeting timer');
        setMeetingTimer(null);
      }
    };

    socket.on('new-vote-result', handleNewVote);
    socket.on('vote-ended', handleVoteEnded);
    // Don't clear on vote-applied - screen should stay on results until admin clicks (X)
    // socket.on('vote-applied', clearVote);
    socket.on('vote-cancelled', clearVote);
    socket.on('vote-broadcast-hide', hideVoteBroadcast);
    socket.on('meeting-show-vote-updated', handleMeetingShowVoteUpdated);
    socket.on('agenda-item-updated', handleAgendaUpdate);
    socket.on('meeting-status-changed', handleMeetingStatus);
    socket.on('user-status-changed', handleParticipantStatusChange);
    socket.on('queue-updated', handleQueueUpdate);
    socket.on('meeting-timer-started', handleTimerStarted);
    socket.on('meeting-timer-stopped', handleTimerStopped);

    return () => {
      socket.off('new-vote-result', handleNewVote);
      socket.off('vote-ended', handleVoteEnded);
      // socket.off('vote-applied', clearVote);
      socket.off('vote-cancelled', clearVote);
      socket.off('vote-broadcast-hide', hideVoteBroadcast);
      socket.off('agenda-item-updated', handleAgendaUpdate);
      socket.off('meeting-status-changed', handleMeetingStatus);
      socket.off('user-status-changed', handleParticipantStatusChange);
      socket.off('queue-updated', handleQueueUpdate);
      socket.off('meeting-timer-started', handleTimerStarted);
      socket.off('meeting-timer-stopped', handleTimerStopped);
    };
  }, [id]);

  const activeItem = meeting?.agendaItems?.find((a) => a.activeIssue);

  // Update timer display every second
  React.useEffect(() => {
    if (!meetingTimer) return undefined;
    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingTimer]);

  // Timer component to show on all screens
  const TimerOverlay = () => {
    if (!meetingTimer) {
      console.log('⏱️ TimerOverlay: meetingTimer is null');
      return null;
    }

    const elapsed = Math.floor((new Date() - meetingTimer.startedAt) / 1000);
    const remaining = Math.max(0, meetingTimer.duration - elapsed);
    console.log('⏱️ TimerOverlay rendering:', { elapsed, remaining, duration: meetingTimer.duration });
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const progress = Math.max(0, 100 - (elapsed / meetingTimer.duration) * 100);

    // Auto-hide when timer ends
    if (remaining <= 0) {
      setTimeout(() => setMeetingTimer(null), 2000);
    }

    return (
      <div style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
        backgroundColor: '#ffffff',
        border: '3px solid #2196f3',
        borderRadius: '16px',
        padding: '24px 36px',
        minWidth: '220px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        zIndex: 9999,
      }}>
        <div style={{
          fontSize: '56px',
          color: remaining <= 10 ? '#f44336' : '#2196f3',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px',
          fontFamily: 'monospace',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          {timeStr}
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#e0e0e0',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: remaining <= 10 ? '#f44336' : '#2196f3',
            transition: 'width 1s linear, background-color 0.3s ease',
          }} />
        </div>
      </div>
    );
  };

  // PRIORITY 1: If meeting is COMPLETED, always show final screen
  if (meeting?.status === 'COMPLETED') {
    const config = screenConfig?.final || {};

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: config.backgroundColor || '#1a1a2e',
          backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${config.paddingTop || 30}px ${config.paddingRight || 30}px ${config.paddingBottom || 30}px ${config.paddingLeft || 30}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Text */}
        {config.topText && (
          <div style={{
            fontSize: config.topTextFontSize || '36px',
            color: config.topTextColor || '#ffffff',
            fontWeight: 'bold',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            {config.topText}
          </div>
        )}

        {/* Center Logo */}
        {config.logoUrl && (
          <div style={{ marginBottom: '40px' }}>
            <img src={config.logoUrl} alt="Logo" style={{ maxWidth: '400px', maxHeight: '400px' }} />
          </div>
        )}

        {/* Bottom Text */}
        {config.bottomText && (
          <div style={{
            fontSize: config.bottomTextFontSize || '28px',
            color: config.bottomTextColor || '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {config.bottomText}
          </div>
        )}
        <TimerOverlay />
      </div>
    );
  }

  // PRIORITY 2: If there's an active vote, show voting screen
  if (vote) {
    const config = screenConfig?.voting || {};

    // Calculate timer and progress
    const getVoteTimer = () => {
      if (!vote.duration) return '00:00';
      const created = new Date(vote.createdAt);
      const totalSeconds = vote.duration;
      const elapsed = Math.floor((new Date() - created) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgressPercent = () => {
      if (!vote.duration) return 100;
      const created = new Date(vote.createdAt);
      const totalSeconds = vote.duration;
      const elapsed = Math.floor((new Date() - created) / 1000);
      const percentElapsed = Math.min(100, (elapsed / totalSeconds) * 100);
      // Return remaining percentage (100% at start, 0% at end)
      return 100 - percentElapsed;
    };

    // Calculate quorum - кворум есть всегда (если собрание началось, значит кворум есть)
    const hasQuorum = true;

    // Determine result
    const getResultTitle = () => {
      if (vote.voteStatus === 'PENDING') {
        return 'ИДЕТ ГОЛОСОВАНИЕ';
      }
      if (vote.decision) {
        const decision = vote.decision.toLowerCase();
        if (decision.includes('принято') && !decision.includes('не принято')) {
          return 'РЕШЕНИЕ ПРИНЯТО';
        }
        if (decision.includes('не принято')) {
          return 'РЕШЕНИЕ НЕ ПРИНЯТО';
        }
        return vote.decision.toUpperCase();
      }
      // Fallback logic
      if (vote.votesFor > vote.votesAgainst) {
        return 'РЕШЕНИЕ ПРИНЯТО';
      }
      return 'РЕШЕНИЕ НЕ ПРИНЯТО';
    };

    const getResultColor = () => {
      if (vote.voteStatus === 'PENDING') {
        return config.resultTitleColor || '#ffffff';
      }
      const decision = vote.decision ? vote.decision.toLowerCase() : '';
      if (decision.includes('принято') && !decision.includes('не принято')) {
        return '#4caf50'; // Green
      }
      return '#f44336'; // Red
    };

    const isVoting = vote.voteStatus === 'PENDING';
    const timer = getVoteTimer();
    const progress = getProgressPercent();
    const resultTitle = getResultTitle();
    const resultColor = getResultColor();

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: config.backgroundColor || '#1a1a2e',
          backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: `${config.paddingTop || 30}px ${config.paddingRight || 30}px ${config.paddingBottom || 30}px ${config.paddingLeft || 30}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo (Left Top) */}
        {config.logoUrl && (
          <div style={{ position: 'absolute', left: `${config.paddingLeft || 30}px`, top: `${config.paddingTop || 30}px`, width: '9%' }}>
            <img src={config.logoUrl} alt="Logo" style={{ width: '100%' }} />
            <div style={{ textAlign: 'center', fontSize: '18px', color: config.meetingTitleColor || '#ffffff', marginTop: '10px', fontWeight: 'bold' }}>
              {activeItem?.number || ''}
            </div>
          </div>
        )}

        {/* Meeting Title (Top Center) */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: config.meetingTitleFontSize || '28px', color: config.meetingTitleColor || '#ffffff', fontWeight: 'bold' }}>
            {meeting?.name || 'ЗАСЕДАНИЕ'}
          </div>
        </div>

        {/* Progress Bar and Timer */}
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              width: '100%',
              height: `${config.progressBarHeight || 8}px`,
              backgroundColor: config.progressBarBgColor || '#ffffff',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: config.progressBarFillColor || '#2196f3',
                transition: 'width 1s linear'
              }} />
            </div>
          </div>
          <div style={{
            fontSize: config.timerFontSize || '36px',
            color: config.timerColor || '#ffffff',
            fontWeight: 'bold',
            minWidth: '120px',
            textAlign: 'right'
          }}>
            {timer}
          </div>
        </div>

        {/* Main Content - Centered */}
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          {/* Vote Question Title */}
          {vote.question && (
            <div style={{
              fontSize: config.questionFontSize || '36px',
              color: config.questionColor || '#ffffff',
              fontWeight: 'bold',
              marginBottom: '30px',
              lineHeight: '1.3'
            }}>
              {vote.question}
            </div>
          )}

          {/* Result Title */}
          <div style={{
            fontSize: config.resultTitleFontSize || '48px',
            color: resultColor,
            fontWeight: 'bold',
            marginBottom: '40px',
            letterSpacing: '4px'
          }}>
            {resultTitle}
          </div>

          {/* Vote Results */}
          <div style={{ textAlign: 'right', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>ЗА</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{vote.votesFor}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>ПРОТИВ</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{vote.votesAgainst}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>ВОЗДЕРЖАЛОСЬ</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{vote.votesAbstain}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>НЕ ГОЛОСОВАЛИ</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{vote.votesAbsent}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
              <span style={{ fontSize: config.quorumFontSize || '28px', color: config.quorumColor || '#ffffff', fontWeight: 'bold' }}>КВОРУМ</span>
              <span style={{ fontSize: config.quorumFontSize || '28px', color: config.quorumColor || '#ffffff', fontWeight: 'bold' }}>{hasQuorum ? 'ЕСТЬ' : 'НЕТ'}</span>
            </div>
          </div>
        </div>
        <TimerOverlay />
      </div>
    );
  }

  // If there's an active agenda item (but no vote), show agenda screen
  if (activeItem) {
    const config = screenConfig?.agenda || {};

    // Filter queues by status and get first 5
    const activeQuestions = questionQueue.filter(q => q.status === 'ACTIVE');
    const waitingQuestions = questionQueue.filter(q => q.status === 'WAITING');
    const allQuestions = [...activeQuestions, ...waitingQuestions].slice(0, 5);

    const activeSpeeches = speechQueue.filter(s => s.status === 'ACTIVE');
    const waitingSpeeches = speechQueue.filter(s => s.status === 'WAITING');
    const allSpeeches = [...activeSpeeches, ...waitingSpeeches].slice(0, 5);

    // Calculate time remaining for active items
    const getTimeRemaining = (item) => {
      if (!item.timerEndTime) return null;
      const now = new Date();
      const end = new Date(item.timerEndTime);
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: config.backgroundColor || '#1a1a2e',
          backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: `${config.paddingTop || 30}px ${config.paddingRight || 30}px ${config.paddingBottom || 30}px ${config.paddingLeft || 30}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo (Left Top, 9% width) */}
        {config.logoUrl && (
          <div style={{ position: 'absolute', left: '0', top: '0', width: '9%' }}>
            <img src={config.logoUrl} alt="Logo" style={{ width: '100%' }} />
          </div>
        )}

        {/* Meeting Title (Center Top) */}
        <div style={{ position: 'absolute', left: '15%', right: '15%', top: '0', textAlign: 'center' }}>
          <div style={{ fontSize: config.meetingTitleFontSize || '32px', color: config.meetingTitleColor || '#ffffff', fontWeight: 'bold' }}>
            {meeting?.name || 'ЗАСЕДАНИЕ'}
          </div>
        </div>

        {/* Date (Right Top) */}
        <div style={{ position: 'absolute', right: '0', top: '0', textAlign: 'right' }}>
          <div style={{ fontSize: config.dateFontSize || '20px', color: config.dateColor || '#ffffff' }}>
            {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            <br />
            {new Date().toLocaleTimeString('ru-RU')}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ marginTop: '100px' }}>
          {/* Current Question Title */}
          <div style={{ fontSize: config.currentQuestionFontSize || '36px', color: config.currentQuestionColor || '#ffffff', textAlign: 'left', marginBottom: '30px', fontWeight: 'bold' }}>
            {activeItem.number} {activeItem.title}
          </div>

          {/* Speaker (if exists) */}
          {activeItem.speakerName && activeItem.speakerName.trim() !== '' && (
            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: config.speakersLabelFontSize || '24px', color: config.speakersLabelColor || '#ffffff', marginBottom: '10px' }}>
                ДОКЛАДЫВАЮТ:
              </div>
              <div style={{ fontSize: config.speakersNamesFontSize || '20px', color: config.speakersNamesColor || '#ffffff', lineHeight: '1.6' }}>
                {activeItem.speakerName}
              </div>
            </div>
          )}

          {/* Question and Speech Queues - Same Line */}
          <div style={{ display: 'flex', gap: '40px', marginBottom: '15px' }}>
            {/* Question Section */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: config.questionNumberFontSize || '24px', color: config.questionNumberColor || '#ffffff', marginBottom: '10px' }}>
                ВОПРОС <span style={{
                  display: 'inline-block',
                  width: '35px',
                  height: '35px',
                  lineHeight: '35px',
                  textAlign: 'center',
                  backgroundColor: '#555',
                  borderRadius: '4px',
                  marginLeft: '8px'
                }}>{waitingQuestions.length}</span>
              </div>
              {/* Question Queue List - First 5 */}
              <div>
                {allQuestions.map((q, index) => {
                  const isActive = q.status === 'ACTIVE';
                  const timeRemaining = isActive ? getTimeRemaining(q) : null;
                  return (
                    <div
                      key={q.id}
                      style={{
                        fontSize: config.speakerItemFontSize || '22px',
                        color: config.speakerItemColor || '#ffffff',
                        padding: '10px 15px',
                        backgroundColor: isActive ? (config.activeSpeakerBgColor || '#2196f3') : 'transparent',
                        marginBottom: '8px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{index + 1}. {q.user?.name || 'Неизвестно'}</span>
                      {timeRemaining && (
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '28px',
                          color: '#ffeb3b'
                        }}>
                          {timeRemaining}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Speech Section */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: config.speechNumberFontSize || '24px', color: config.speechNumberColor || '#ffffff', marginBottom: '10px' }}>
                ВЫСТУПЛЕНИЕ <span style={{
                  display: 'inline-block',
                  width: '35px',
                  height: '35px',
                  lineHeight: '35px',
                  textAlign: 'center',
                  backgroundColor: '#555',
                  borderRadius: '4px',
                  marginLeft: '8px'
                }}>{waitingSpeeches.length}</span>
              </div>
              {/* Speech Queue List - First 5 */}
              <div>
                {allSpeeches.map((s, index) => {
                  const isActive = s.status === 'ACTIVE';
                  const timeRemaining = isActive ? getTimeRemaining(s) : null;
                  return (
                    <div
                      key={s.id}
                      style={{
                        fontSize: config.speakerItemFontSize || '22px',
                        color: config.speakerItemColor || '#ffffff',
                        padding: '10px 15px',
                        backgroundColor: isActive ? (config.activeSpeechBgColor || '#ff9800') : 'transparent',
                        marginBottom: '8px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{index + 1}. {s.user?.name || 'Неизвестно'}</span>
                      {timeRemaining && (
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '28px',
                          color: '#ffeb3b'
                        }}>
                          {timeRemaining}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <TimerOverlay />
      </div>
    );
  }

  // Otherwise show registration screen
  const config = screenConfig?.registration || {};
  const totalParticipants = participants.length;
  const onlineParticipants = participants.filter(p => p.isOnline);

  // All offline participants (including those who gave proxy)
  const offlineParticipants = participants.filter(p => !p.isOnline);

  // Count total present: online participants + all received proxies by online participants
  const totalReceivedProxies = onlineParticipants.reduce((sum, p) => {
    return sum + (Array.isArray(p.receivedProxies) ? p.receivedProxies.length : 0);
  }, 0);

  const onlineCount = onlineParticipants.length + totalReceivedProxies;

  // Count how many participants gave proxy (shown in brackets)
  const proxyCount = totalReceivedProxies;

  const offlineNames = offlineParticipants.map(p => p.name).join(', ');

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 'none',
        backgroundColor: config.backgroundUrl ? 'transparent' : (config.backgroundColor || '#1a1a2e'),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: config.textColor || '#ffffff',
        padding: `${config.paddingTop || 40}px ${config.paddingRight || 20}px ${config.paddingBottom || 40}px ${config.paddingLeft || 20}px`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Logo and Date (Left 18% relative to padding) */}
      <div style={{ float: 'left', width: '18%', marginBottom: '20px' }}>
        {config.showLogo && config.logoUrl && (
          <img src={config.logoUrl} alt="Logo" style={{ width: '100%', marginBottom: '20px' }} />
        )}
        {config.showDate && (
          <div style={{ fontSize: '18px', color: config.textColor || '#ffffff', textAlign: 'center' }}>
            {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            <br />
            {new Date().toLocaleTimeString('ru-RU')}
          </div>
        )}
      </div>

      {/* Main Content (starts at 22% from left edge, relative to padding) */}
      <div style={{ marginLeft: '22%' }}>
        {/* Title */}
        <div style={{
          fontSize: config.titleFontSize || '48px',
          color: config.titleColor || '#ffffff',
          textAlign: 'center',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          {meeting?.name || 'ЗАСЕДАНИЕ'}
        </div>

        {/* Blue Line */}
        <div style={{ height: '4px', backgroundColor: config.lineColor || '#2196f3', marginBottom: '40px' }} />

        {/* Registration Header */}
        <div style={{
          fontSize: config.subtitleFontSize || '36px',
          color: config.subtitleColor || '#ffffff',
          textAlign: 'center',
          marginBottom: '30px',
          fontWeight: 'bold',
          letterSpacing: '8px'
        }}>
          РЕГИСТРАЦИЯ
        </div>

        {/* Stats */}
        <div style={{ fontSize: config.textFontSize || '24px', color: config.textColor || '#ffffff', marginBottom: '30px' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ display: 'inline-block', width: '300px' }}>ПО СПИСКУ:</span>
            <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{totalParticipants}</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ display: 'inline-block', width: '300px' }}>ПРИСУТСТВУЮТ:</span>
            <span style={{ fontSize: '42px', fontWeight: 'bold' }}>
              {onlineCount} {proxyCount > 0 ? `(${proxyCount})` : ''}
            </span>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ display: 'inline-block', width: '300px' }}>ОТСУТСТВУЮТ:</span>
          </div>
        </div>

        {/* Names List */}
        <div style={{
          fontSize: config.namesFontSize || '20px',
          color: config.namesColor || config.textColor || '#ffffff',
          lineHeight: '1.6',
          marginTop: '10px'
        }}>
          {offlineParticipants.length > 0
            ? offlineParticipants.map(p => p.name).join(', ')
            : 'Все присутствуют'
          }
        </div>
      </div>

      {/* Independent Meeting Timer - Bottom Right */}
      {meetingTimer && (() => {
        const elapsed = Math.floor((new Date() - meetingTimer.startedAt) / 1000);
        const remaining = Math.max(0, meetingTimer.duration - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const progress = Math.max(0, 100 - (elapsed / meetingTimer.duration) * 100);

        // Auto-hide when timer ends
        if (remaining <= 0) {
          setTimeout(() => setMeetingTimer(null), 2000);
        }

        return (
          <div style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            backgroundColor: '#ffffff',
            border: '3px solid #2196f3',
            borderRadius: '16px',
            padding: '24px 36px',
            minWidth: '220px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            zIndex: 9999,
          }}>
            <div style={{
              fontSize: '56px',
              color: remaining <= 10 ? '#f44336' : '#2196f3',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '16px',
              fontFamily: 'monospace',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              {timeStr}
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#e0e0e0',
              borderRadius: '6px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: remaining <= 10 ? '#f44336' : '#2196f3',
                transition: 'width 1s linear, background-color 0.3s ease',
              }} />
            </div>
          </div>
        );
      })()}
      <TimerOverlay />
    </div>
  );
}

export default MeetingScreenPage;
