import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../utils/socket.js';
import { getMeeting, getVoteResults, getAgendaItems, getMeetingParticipants } from '../utils/api.js';

// Helper to check if user belongs to system/invited group
const isInvitedUser = (user) => {
  // Check if user has divisions array (from API)
  if (Array.isArray(user.divisions) && user.divisions.length > 0) {
    return user.divisions.some(d => {
      if (!d || !d.name) return false;
      const name = d.name.replace(/👥/g, '').trim().toLowerCase();
      return name === 'приглашенные';
    });
  }
  // Fallback: check single division object
  if (user.division && user.division.name) {
    const name = user.division.name.replace(/👥/g, '').trim().toLowerCase();
    return name === 'приглашенные';
  }
  return false;
};

// Broadcast screen only: long question texts are cut at 699 chars + "..."
const truncateQuestion = (text, max = 699) => {
  if (!text) return text;
  const s = String(text);
  return s.length > max ? s.slice(0, max).trimEnd() + '...' : s;
};

// Quorum by the registration rule: «Зал» — Televic badge, «Сайт» — website or badge;
// proxies received by registered participants are added. required === null → no check.
const computeQuorum = (participants, meeting) => {
  const regular = participants.filter(p => !isInvitedUser(p));
  const registered = regular.filter(p => (p.location === 'HALL' ? !!p.isBadgeInserted : (p.isOnline || p.isBadgeInserted)));
  const proxies = registered.reduce((s, p) => s + (Array.isArray(p.receivedProxies) ? p.receivedProxies.length : 0), 0);
  const present = registered.length + proxies;
  const total = regular.length;
  const required = meeting?.quorumType === 'MORE_THAN_ONE' ? 2
    : meeting?.quorumType === 'HALF_PLUS_ONE' ? Math.floor(total / 2) + 1
    : meeting?.quorumType === 'TWO_THIRDS_OF_TOTAL' ? Math.ceil((2 * total) / 3)
    : null;
  return { present, total, required, has: required === null ? true : present >= required };
};

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
            // FIXED: If trigger is OFF but we already have vote results showing,
            // keep them displayed until explicitly hidden by user action
            // Only clear if there's no current vote or it's a new pending vote starting
            setVote((prevVote) => {
              // If we have vote results showing (ENDED/APPLIED), keep showing them —
              // but refresh the data from the fresh poll (Televic results may have
              // arrived and updated the counters/decision/pending flag)
              if (prevVote && (prevVote.voteStatus === 'ENDED' || prevVote.voteStatus === 'APPLIED')) {
                const fresh = voteResults.find((r) => r.id === prevVote.id);
                return fresh || prevVote;
              }
              // The vote we were showing as PENDING has just finished — switch
              // straight to its final result instead of flashing the agenda screen
              // (the vote-ended socket event may arrive a moment later)
              if (prevVote && prevVote.voteStatus === 'PENDING') {
                const finished = voteResults.find((r) => r.id === prevVote.id);
                if (finished && (finished.voteStatus === 'ENDED' || finished.voteStatus === 'APPLIED')) {
                  return finished;
                }
                if (finished && finished.voteStatus === 'PENDING') {
                  return finished;
                }
              }
              // Otherwise clear (e.g., no vote was ever shown)
              return null;
            });
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
      // Ключ учитывает фазу подсчёта: событие «таймер кончился» (подсчёт идёт)
      // и событие «результаты пультов пришли» не должны дедуплицироваться
      const eventKey = `vote-ended-${data?.id}-${data?.televicResultsPending ? 'pending' : 'final'}`;
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

    const handleBadgeStatusChanged = (data) => {
      // Update isBadgeInserted status in real-time
      setParticipants((prev) => prev.map((p) =>
        p.id === data?.userId ? { ...p, isBadgeInserted: data.isBadgeInserted } : p
      ));
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
    socket.on('badge-status-changed', handleBadgeStatusChanged);
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
      socket.off('badge-status-changed', handleBadgeStatusChanged);
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
        padding: '24px 36px',
        minWidth: '220px',
        zIndex: 9999,
      }}>
        <div style={{
          fontSize: '56px',
          color: remaining <= 10 ? '#f44336' : '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px',
          fontFamily: 'monospace',
          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
        }}>
          {timeStr}
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
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

    // Кворум по правилу регистрации (общая формула для всех экранов)
    const hasQuorum = computeQuorum(participants, meeting).has;

    // После таймера, пока не пришли результаты с пультов Televic, — «подсчёт»
    const isCountingVotes = vote.voteStatus !== 'PENDING' && !!vote.televicResultsPending;

    // Determine result
    const getResultTitle = () => {
      if (vote.voteStatus === 'PENDING') {
        return 'ИДЕТ ГОЛОСОВАНИЕ';
      }
      if (isCountingVotes) {
        return 'ИДЕТ ПОДСЧЕТ ГОЛОСОВ';
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
      if (vote.voteStatus === 'PENDING' || isCountingVotes) {
        return config.resultTitleColor || '#ffffff';
      }
      const decision = vote.decision ? vote.decision.toLowerCase() : '';
      if (decision.includes('принято') && !decision.includes('не принято')) {
        return '#4caf50'; // Green
      }
      return '#f44336'; // Red
    };

    const isVoting = vote.voteStatus === 'PENDING' || isCountingVotes;
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

        {/* Progress Bar and Timer — starts after the logo, never underneath it */}
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px', marginLeft: config.logoUrl ? 'calc(9% + 20px)' : 0 }}>
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
              {truncateQuestion(vote.question)}
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

          {/* Vote Results — во время голосования строки видны, но с нулями,
              чтобы промежуточные голоса с сайта не светились; реальные общие
              цифры (сайт + Televic) появляются после завершения таймера */}
          <div style={{ textAlign: 'right', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>ЗА</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{isVoting ? 0 : vote.votesFor}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>ПРОТИВ</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{isVoting ? 0 : vote.votesAgainst}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>ВОЗДЕРЖАЛОСЬ</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{isVoting ? 0 : vote.votesAbstain}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: config.voteLabelFontSize || '32px', color: config.voteLabelColor || '#ffffff' }}>НЕ ГОЛОСОВАЛИ</span>
              <span style={{ fontSize: config.voteNumberFontSize || '32px', color: config.voteNumberColor || '#ffffff', fontWeight: 'bold' }}>{isVoting ? 0 : vote.votesAbsent}</span>
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

  // Кворум для повестки и экрана регистрации (общая формула)
  const screenQuorum = computeQuorum(participants, meeting);

  // If there's an active agenda item (but no vote), show agenda screen.
  // Без кворума вопрос не показываем — остаётся экран регистрации со строкой КВОРУМ;
  // как только кворум набран, вопрос появляется сам.
  if (activeItem && screenQuorum.has) {
    const config = screenConfig?.agenda || {};

    // Filter queues by status; show at most 4 entries, the rest is collapsed into "..."
    const QUEUE_LIMIT = 4;
    const activeQuestions = questionQueue.filter(q => q.status === 'ACTIVE');
    const waitingQuestions = questionQueue.filter(q => q.status === 'WAITING');
    const fullQuestions = [...activeQuestions, ...waitingQuestions];
    const allQuestions = fullQuestions.slice(0, QUEUE_LIMIT);
    const moreQuestions = fullQuestions.length > QUEUE_LIMIT;

    const activeSpeeches = speechQueue.filter(s => s.status === 'ACTIVE');
    const waitingSpeeches = speechQueue.filter(s => s.status === 'WAITING');
    const fullSpeeches = [...activeSpeeches, ...waitingSpeeches];
    const allSpeeches = fullSpeeches.slice(0, QUEUE_LIMIT);
    const moreSpeeches = fullSpeeches.length > QUEUE_LIMIT;

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
          <div style={{ position: 'absolute', left: `${config.paddingLeft || 30}px`, top: '0', width: '9%' }}>
            <img src={config.logoUrl} alt="Logo" style={{ width: '100%' }} />
          </div>
        )}

        {/* Meeting Title (Center Top) */}
        <div style={{ position: 'absolute', left: '20%', right: '15%', top: '0', textAlign: 'center' }}>
          <div style={{ fontSize: config.meetingTitleFontSize || '32px', color: config.meetingTitleColor || '#ffffff', fontWeight: 'bold' }}>
            {meeting?.name || 'ЗАСЕДАНИЕ'}
          </div>
        </div>

        {/* Date (Right Top) */}
        <div style={{ position: 'absolute', right: '20px', top: '0', textAlign: 'right' }}>
          <div style={{ fontSize: config.dateFontSize || '17px', color: config.dateColor || '#ffffff' }}>
            {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            <br />
            {new Date().toLocaleTimeString('ru-RU')}
          </div>
        </div>

        {/* Main Content — minHeight keeps the queue block at a stable spot;
            a longer question simply pushes it further down */}
        <div style={{ marginTop: '135px', display: 'flex', justifyContent: 'center', minHeight: '595px' }}>
          <div style={{ width: '80%', display: 'flex', gap: '20px' }}>
            {/* Agenda Number - Left Side */}
            <div style={{
              fontSize: '28px',
              color: config.currentQuestionColor || '#ffffff',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {activeItem.number}.
            </div>

            {/* Agenda Content - Right Side */}
            <div style={{ flex: 1 }}>
              {/* Current Question Title — ДОКЛАДЫВАЮТ follows right below the text;
                  only the queue block position is fixed (min-height on the wrapper) */}
              <div style={{ fontSize: '28px', color: config.currentQuestionColor || '#ffffff', textAlign: 'left', marginBottom: '24px', fontWeight: 'bold' }}>
                {truncateQuestion(activeItem.title)}
              </div>

            {/* Speaker (if exists) */}
            {activeItem.speakerName && activeItem.speakerName.trim() !== '' && (
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ fontSize: '28px', color: config.speakersLabelColor || '#ffffff', marginBottom: '10px' }}>
                  ДОКЛАДЫВАЮТ:
                </div>
                <div style={{ fontSize: '28px', color: config.speakersNamesColor || '#ffffff', lineHeight: '1.6' }}>
                  {activeItem.speakerName}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Question and Speech Queues — in normal flow, always below the question text */}
        <div style={{
          marginTop: '20px',
          zIndex: 10
        }}>
          <div style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            width: '80%'
          }}>
          <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', justifyContent: 'flex-start' }}>
            {/* Question Section — скрыт, если очередь вопросов отключена */}
            {meeting?.questionQueueEnabled !== false && (
            <div style={{ minWidth: '500px' }}>
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
                        padding: '6px 15px',
                        backgroundColor: isActive ? (config.activeSpeakerBgColor || '#2196f3') : 'transparent',
                        marginBottom: '6px',
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
                {moreQuestions && (
                  <div style={{ fontSize: config.speakerItemFontSize || '22px', color: config.speakerItemColor || '#ffffff', padding: '0 15px' }}>
                    …
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Speech Section — скрыт, если очередь выступлений отключена */}
            {meeting?.speechQueueEnabled !== false && (
            <div style={{ minWidth: '250px' }}>
              <div style={{ fontSize: config.questionNumberFontSize || '24px', color: config.speechNumberColor || '#ffffff', marginBottom: '10px' }}>
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
                        padding: '6px 15px',
                        backgroundColor: isActive ? (config.activeSpeechBgColor || '#ff9800') : 'transparent',
                        marginBottom: '6px',
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
                {moreSpeeches && (
                  <div style={{ fontSize: config.speakerItemFontSize || '22px', color: config.speakerItemColor || '#ffffff', padding: '0 15px' }}>
                    …
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          </div>
        </div>

        <TimerOverlay />
      </div>
    );
  }

  // Otherwise show registration screen
  const config = screenConfig?.registration || {};

  // Filter out invited participants (👥Приглашенные) from all counts
  const regularParticipants = participants.filter(p => !isInvitedUser(p));

  const totalParticipants = regularParticipants.length;
  // Participants with location "Зал" (HALL) register ONLY via Televic badge —
  // a website login does not count for them. "Сайт" (SITE) — website or badge.
  const isRegistered = (p) => (p.location === 'HALL' ? !!p.isBadgeInserted : (p.isOnline || p.isBadgeInserted));
  const onlineParticipants = regularParticipants.filter(isRegistered);

  // Everyone not registered by the rule above goes to the absent list
  const offlineParticipants = regularParticipants.filter(p => !isRegistered(p));

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
          {screenQuorum.required !== null && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{ display: 'inline-block', width: '300px' }}>КВОРУМ:</span>
              <span style={{ fontSize: '42px', fontWeight: 'bold', color: screenQuorum.has ? '#4caf50' : '#f44336' }}>
                {screenQuorum.has ? 'ЕСТЬ' : `НЕТ (требуется ${screenQuorum.required})`}
              </span>
            </div>
          )}
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

      {/* Единый таймер заседания (TimerOverlay) — без дубля со старым стилем */}
      <TimerOverlay />
    </div>
  );
}

export default MeetingScreenPage;
