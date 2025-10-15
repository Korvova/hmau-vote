import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { getMeeting, getAgendaItems, getUsers, startAgendaItem as startAgendaItemRequest, apiRequest, getVoteResults, endVote, logout as apiLogout } from '../utils/api.js';
import StartVoteModal from '../components/StartVoteModal.jsx';
import TimerModal from '../components/TimerModal.jsx';
import QueueBlock from '../components/QueueBlock.jsx';
import { io } from 'socket.io-client';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import VoteResultsPDF from '../components/VoteResultsPDF.jsx';
import DetailedVoteResultsPDF from '../components/DetailedVoteResultsPDF.jsx';

function ControlMeetingPage() {
  const { id } = useParams();
  const [configOpen, setConfigOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [voteModal, setVoteModal] = useState({ open: false, agendaId: null });
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [participants, setParticipants] = useState([]); // Participants with location and proxy info
  const [timeLeft, setTimeLeft] = useState(null);
  const [voteEndTime, setVoteEndTime] = useState(null);
  const [activeVoteQuestion, setActiveVoteQuestion] = useState(null); // Store question for active vote
  const [endedResult, setEndedResult] = useState(null);
  const [voteError, setVoteError] = useState('');
  const [addQuestionModal, setAddQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', speakerName: '' });
  const [durationTemplates, setDurationTemplates] = useState([]);
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [allVoteResults, setAllVoteResults] = useState([]);
  const [detailedPdfData, setDetailedPdfData] = useState(null); // For individual agenda item PDF
  const [timerModal, setTimerModal] = useState(false);
  const [meetingTimerLeft, setMeetingTimerLeft] = useState(null); // Meeting timer countdown

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try {
      const raw = localStorage.getItem('authUser');
      const auth = raw ? JSON.parse(raw) : null;
      if (auth?.email) await apiLogout(auth.email);
    } catch {}
    localStorage.removeItem('authUser');
    window.location.href = '/hmau-vote/login';
  };

  const handleMicrophoneToggle = async (user) => {
    if (!user.televicExternalId) {
      alert('Пользователь не связан с Televic делегатом');
      return;
    }

    try {
      const newMutedState = !user.muted;
      const action = newMutedState ? 'disable' : 'enable';

      await axios.post('/api/televic/microphone/toggle', {
        userId: user.id,
        action
      });

      // Обновить локальное состояние
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, muted: newMutedState } : u
      ));
      setParticipants((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, muted: newMutedState } : u
      ));
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      alert('Не удалось переключить микрофон: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStartTimer = async (duration) => {
    try {
      await apiRequest(`/api/meetings/${id}/timer`, {
        method: 'POST',
        body: JSON.stringify({ duration }),
      });
      alert('Таймер запущен');
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  };

  const handleStopTimer = async () => {
    try {
      await apiRequest(`/api/meetings/${id}/timer`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const processAgenda = (items) =>
    items.map((it) => ({
      ...it,
      inVote: Boolean(it.inVote || it.voting || it.activeIssue),
      completed: Boolean(it.completed),
    }));

  useEffect(() => {
    (async () => {
      try {
        const [m, ag, dt] = await Promise.all([
          getMeeting(id),
          getAgendaItems(id).catch(() => []),
          axios.get('/api/duration-templates').then(res => res.data).catch(() => []),
        ]);
        setMeeting(m || null);
        const items = Array.isArray(ag) && ag.length ? ag : Array.isArray(m?.agendaItems) ? m.agendaItems : [];
        setAgenda(processAgenda(items));
        setDurationTemplates(Array.isArray(dt) ? dt : []);

        // Extract users from meeting divisions
        const meetingUsers = Array.isArray(m?.divisions)
          ? m.divisions.flatMap(d => Array.isArray(d.users) ? d.users : [])
          : [];
        setUsers(meetingUsers);

        // Load participants with location and proxy info
        try {
          const participantsRes = await axios.get(`/api/meetings/${id}/participants`);
          setParticipants(Array.isArray(participantsRes.data) ? participantsRes.data : []);
        } catch (err) {
          console.error('Failed to load participants:', err);
        }

        // Load all vote results if meeting is completed
        if (m?.status === 'COMPLETED') {
          try {
            const voteRes = await getVoteResults(id);
            setAllVoteResults(Array.isArray(voteRes) ? voteRes : []);
          } catch (err) {
            console.error('Failed to load vote results:', err);
          }
        }

        try {
          const rs = await getVoteResults(id).catch(() => []);
          setResults(Array.isArray(rs) ? rs : []);

          // Check if there's an active vote (PENDING status)
          const activeVote = Array.isArray(rs) ? rs.find(r => r.voteStatus === 'PENDING') : null;
          if (activeVote && activeVote.createdAt && activeVote.duration) {
            // Calculate endTime from createdAt + duration
            const createdMs = new Date(activeVote.createdAt).getTime();
            const durationMs = activeVote.duration * 1000;
            const endTime = new Date(createdMs + durationMs).toISOString();
            const now = Date.now();
            const endMs = new Date(endTime).getTime();

            // Only set if vote hasn't ended yet
            if (endMs > now) {
              setVoteEndTime(endTime);
              setActiveVoteQuestion(activeVote.question || 'Голосование');
              setEndedResult(null);
              setVoteError('');
            }
          } else {
            // If no active PENDING vote, check Meeting.showVoteOnBroadcast trigger
            if (m?.showVoteOnBroadcast) {
              // Find most recent ENDED or APPLIED vote to show
              const recentVote = Array.isArray(rs) ? rs.find(r =>
                r.voteStatus === 'ENDED' || r.voteStatus === 'APPLIED'
              ) : null;
              if (recentVote) {
                // Only set activeVoteQuestion for (X) button, don't set endedResult
                // endedResult is only for showing modal when auto-apply fails
                setActiveVoteQuestion(recentVote.question);
              }
            }
          }
        } catch {}
      } catch {}
    })();
  }, [id]);

  // Live updates: user status + vote events
  useEffect(() => {
    const socket = io();
    const processedEvents = new Set();
    const debounceTimers = {};

    const onStatus = (data) => {
      setUsers((prev) => prev.map((u) => (u.id === data?.userId ? { ...u, isOnline: !!data.isOnline } : u)));
      setParticipants((prev) => prev.map((u) => (u.id === data?.userId ? { ...u, isOnline: !!data.isOnline } : u)));
    };
    const onNewVote = (data) => {
      try {
        if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
        const eventKey = `new-vote-${data?.id}`;
        if (processedEvents.has(eventKey)) return;
        processedEvents.add(eventKey);
        setTimeout(() => processedEvents.delete(eventKey), 5000);

        // Use endTime from server if available
        if (data?.endTime) {
          setVoteEndTime(data.endTime);
        } else {
          // Fallback: calculate endTime from createdAt + duration
          const createdMs = data?.createdAt ? new Date(data.createdAt).getTime() : Date.now();
          const duration = Number(data?.duration) || 0;
          const endTime = new Date(createdMs + (duration * 1000)).toISOString();
          setVoteEndTime(endTime);
        }
        setActiveVoteQuestion(data?.question || 'Голосование'); // Store question name
        setEndedResult(null); // Clear previous result
        setVoteError('');
        const agendaId = Number(data?.agendaItemId);
        if (Number.isFinite(agendaId)) {
          setAgenda((prev) => (Array.isArray(prev) ? prev.map((it) => (
            it.id === agendaId ? { ...it, inVote: true, voting: true, activeIssue: true, completed: false } : { ...it, inVote: false }
          )) : prev));
        }
      } catch {}
    };
    const onVoteEnded = async (data) => {
      try {
        if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
        const eventKey = `vote-ended-${data?.id}`;
        if (processedEvents.has(eventKey)) return;
        processedEvents.add(eventKey);
        setTimeout(() => processedEvents.delete(eventKey), 5000);

        setTimeLeft(null);
        setVoteEndTime(null);

        const resultData = {
          id: data?.id,
          question: data?.question,
          votesFor: Number(data?.votesFor) || 0,
          votesAgainst: Number(data?.votesAgainst) || 0,
          votesAbstain: Number(data?.votesAbstain) || 0,
          votesAbsent: Number(data?.votesAbsent) || 0,
          decision: data?.decision || '',
        };

        // First set endedResult temporarily (for (X) button to appear via activeVoteQuestion)
        // But we'll apply immediately and clear it
        setVoteError('');
        const agendaId = Number(data?.agendaItemId);
        if (Number.isFinite(agendaId)) {
          setAgenda((prev) => (Array.isArray(prev) ? prev.map((it) => (
            it.id === agendaId ? { ...it, inVote: false, voting: false } : { ...it, inVote: false }
          )) : prev));
        }

        // Auto-apply vote result to save to database
        try {
          await apiRequest(`/api/vote-results/${resultData.id}/apply`, { method: 'POST' });
          // SUCCESS: Turn ON broadcast trigger to show vote result
          await axios.put(`/api/meetings/${id}/show-vote`, { show: true });
          // Don't set endedResult, so modal doesn't show
          // The (X) button will appear because we have activeVoteQuestion from the pending vote
        } catch (e) {
          console.error('Не удалось автоматически применить результат:', e);
          // ERROR: Set endedResult so user can apply manually via modal
          setEndedResult(resultData);
        }

        // Debounce getVoteResults
        if (debounceTimers.voteEnded) clearTimeout(debounceTimers.voteEnded);
        debounceTimers.voteEnded = setTimeout(async () => {
          try {
            const rs = await getVoteResults(id).catch(() => []);
            setResults(Array.isArray(rs) ? rs : []);
          } catch {}
        }, 500);
      } catch (e) { setVoteError(e?.message || 'Ошибка обработки результата'); }
    };
    const onVoteApplied = async (data) => {
      try {
        if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
        const eventKey = `vote-applied-${data?.id}`;
        if (processedEvents.has(eventKey)) return;
        processedEvents.add(eventKey);
        setTimeout(() => processedEvents.delete(eventKey), 5000);

        setEndedResult(null);
        setVoteError('');

        // Debounce getVoteResults
        if (debounceTimers.voteApplied) clearTimeout(debounceTimers.voteApplied);
        debounceTimers.voteApplied = setTimeout(async () => {
          try {
            const rs = await getVoteResults(id).catch(() => []);
            setResults(Array.isArray(rs) ? rs : []);
          } catch {}
        }, 500);
      } catch (e) {
        console.error('Error in onVoteApplied:', e);
      }
    };
    const onVoteCancelled = async (data) => {
      try {
        if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
        const eventKey = `vote-cancelled-${data?.id}`;
        if (processedEvents.has(eventKey)) return;
        processedEvents.add(eventKey);
        setTimeout(() => processedEvents.delete(eventKey), 5000);

        setEndedResult(null);
        setVoteError('');

        // Debounce getVoteResults
        if (debounceTimers.voteCancelled) clearTimeout(debounceTimers.voteCancelled);
        debounceTimers.voteCancelled = setTimeout(async () => {
          try {
            const rs = await getVoteResults(id).catch(() => []);
            setResults(Array.isArray(rs) ? rs : []);
          } catch {}
        }, 500);
      } catch (e) {
        console.error('Error in onVoteCancelled:', e);
      }
    };
    const onMeetingShowVoteUpdated = (data) => {
      if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
      // Update meeting state with new showVoteOnBroadcast
      setMeeting((prev) => (prev ? { ...prev, showVoteOnBroadcast: data.showVoteOnBroadcast } : prev));
      // If turned OFF, also clear activeVoteQuestion
      if (data.showVoteOnBroadcast === false) {
        setActiveVoteQuestion(null);
      }
    };

    const onMeetingTimerStarted = (data) => {
      if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
      // Set initial timer value
      const startedAt = new Date(data.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, data.duration - elapsed);
      setMeetingTimerLeft(left);
    };

    const onMeetingTimerStopped = (data) => {
      if (data?.meetingId && meeting?.id && Number(data.meetingId) !== Number(meeting.id)) return;
      setMeetingTimerLeft(null);
    };

    const onBadgeStatusChanged = (data) => {
      setUsers((prev) => prev.map((u) =>
        u.id === data?.userId ? { ...u, isBadgeInserted: data.isBadgeInserted } : u
      ));
      setParticipants((prev) => prev.map((u) =>
        u.id === data?.userId ? { ...u, isBadgeInserted: data.isBadgeInserted } : u
      ));
    };

    socket.on('user-status-changed', onStatus);
    socket.on('new-vote-result', onNewVote);
    socket.on('vote-ended', onVoteEnded);
    socket.on('vote-applied', onVoteApplied);
    socket.on('vote-cancelled', onVoteCancelled);
    socket.on('meeting-show-vote-updated', onMeetingShowVoteUpdated);
    socket.on('meeting-timer-started', onMeetingTimerStarted);
    socket.on('meeting-timer-stopped', onMeetingTimerStopped);
    socket.on('badge-status-changed', onBadgeStatusChanged);
    return () => {
      // Clear all debounce timers
      Object.values(debounceTimers).forEach(timer => clearTimeout(timer));
      socket.off('user-status-changed', onStatus);
      socket.off('new-vote-result', onNewVote);
      socket.off('vote-ended', onVoteEnded);
      socket.off('vote-applied', onVoteApplied);
      socket.off('vote-cancelled', onVoteCancelled);
      socket.off('meeting-timer-started', onMeetingTimerStarted);
      socket.off('meeting-timer-stopped', onMeetingTimerStopped);
      socket.off('badge-status-changed', onBadgeStatusChanged);
      socket.disconnect();
    };
  }, [meeting?.id, id]);

  // Countdown for active vote - using server endTime
  useEffect(() => {
    if (!voteEndTime) return undefined;

    const updateTimer = () => {
      const now = Date.now();
      const endMs = new Date(voteEndTime).getTime();
      const left = Math.max(0, Math.floor((endMs - now) / 1000));
      setTimeLeft(left);

      if (left <= 0) {
        setVoteEndTime(null);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [voteEndTime]);

  // Countdown for meeting timer
  useEffect(() => {
    if (meetingTimerLeft === null) return undefined;

    const updateMeetingTimer = () => {
      setMeetingTimerLeft((prev) => {
        if (prev === null || prev <= 0) return null;
        return prev - 1;
      });
    };

    // Update every second
    const interval = setInterval(updateMeetingTimer, 1000);

    return () => clearInterval(interval);
  }, [meetingTimerLeft]);

  const startMeeting = async () => {
    console.log('[ControlMeetingPage] startMeeting clicked, meeting status:', meeting?.status);
    console.log('[ControlMeetingPage] meeting object:', meeting);

    if (meeting?.status === 'IN_PROGRESS') {
      console.log('[ControlMeetingPage] Meeting is IN_PROGRESS, will stop it');
      try {
        // Stop meeting in database
        console.log('[ControlMeetingPage] Stopping meeting in database...');
        await apiRequest(`/api/meetings/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'COMPLETED' }) });
        console.log('[ControlMeetingPage] Meeting stopped in database');

        // Stop meeting in Televic CoCon if it was created there
        console.log('[ControlMeetingPage] Checking if meeting has televicMeetingId:', meeting?.televicMeetingId);
        if (meeting?.televicMeetingId) {
          console.log('[ControlMeetingPage] Meeting has televicMeetingId, will stop in CoCon');
          try {
            console.log('[ControlMeetingPage] Calling /api/televic/meeting/stop with meetingId:', id);
            await axios.post('/api/televic/meeting/stop', { meetingId: id });
            console.log('[Televic] Meeting stopped in CoCon successfully!');
          } catch (televicError) {
            console.error('[Televic] Failed to stop meeting in CoCon:', televicError);
            // Don't fail the whole operation if Televic stop fails
          }
        } else {
          console.log('[ControlMeetingPage] Meeting does NOT have televicMeetingId, skipping CoCon stop');
        }

        setMeeting((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
        const rs = await getVoteResults(id).catch(() => []);
        setResults(Array.isArray(rs) ? rs : []);
        alert('Заседание завершено');
      } catch (e) {
        console.error('[ControlMeetingPage] Error stopping meeting:', e);
        alert(e.message || 'Не удалось завершить заседание');
      }
    } else {
      try {
        await apiRequest(`/api/meetings/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'IN_PROGRESS' }) });
        setMeeting((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : prev));
        alert('Заседание запущено');
      } catch (e) {
        alert(e.message || 'Не удалось запустить заседание');
      }
    }
  };

  const startAgendaItem = async (agendaId) => {
    try {
      await startAgendaItemRequest(id, agendaId);
      alert('Пункт повестки запущен');
    } catch (e) {
      alert(e.message || 'Не удалось запустить пункт повестки');
    }
  };

  const endAgendaVote = async (agendaId) => {
    try {
      await endVote(agendaId);
      setAgenda((prev) =>
        prev.map((it) =>
          it.id === agendaId ? { ...it, inVote: false } : it
        )
      );
      const rs = await getVoteResults(id).catch(() => []);
      setResults(Array.isArray(rs) ? rs : []);
      alert('Голосование завершено');
    } catch (e) {
      alert(e.message || 'Не удалось завершить голосование');
    }
  };

  const completeAgendaItem = async (agendaId) => {
    const ok = window.confirm('Завершить вопрос повестки? После этого будет невозможно провести голосование по этому вопросу.');
    if (!ok) return;
    try {
      await apiRequest(`/api/meetings/${id}/agenda-items/${agendaId}`, {
        method: 'PUT',
        body: JSON.stringify({
          completed: true,
          activeIssue: false,
        }),
      });
      setAgenda((prev) =>
        prev.map((it) =>
          it.id === agendaId ? { ...it, completed: true, activeIssue: false } : it
        )
      );
      alert('Вопрос завершен');
    } catch (e) {
      alert(e.message || 'Не удалось завершить вопрос');
    }
  };

  const fetchDetailedVoteData = async (agendaItemId) => {
    try {
      const response = await axios.get(`/api/agenda-items/${agendaItemId}/detailed-votes`);
      setDetailedPdfData(response.data);
    } catch (error) {
      console.error('Failed to fetch detailed vote data:', error);
      alert('Не удалось загрузить данные голосования');
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.title.trim()) {
      alert('Введите название вопроса');
      return;
    }
    try {
      const nextNumber = Math.max(0, ...agenda.map(a => a.number || 0)) + 1;
      const response = await apiRequest(`/api/meetings/${id}/agenda-items`, {
        method: 'POST',
        body: JSON.stringify({
          number: nextNumber,
          title: newQuestion.title.trim(),
          speakerName: newQuestion.speakerName.trim() || null,
          link: null,
        }),
      });

      // Добавляем новый вопрос в список
      setAgenda((prev) => [...prev, {
        ...response,
        inVote: false,
        completed: false,
        activeIssue: false,
        speaker: newQuestion.speakerName.trim() || 'Нет',
      }]);

      setAddQuestionModal(false);
      setNewQuestion({ title: '', speakerName: '' });
      alert('Вопрос добавлен');
    } catch (e) {
      alert(e.message || 'Не удалось добавить вопрос');
    }
  };

  // Завершить текущее голосование и сразу запустить новое по тому же пункту
  const restartAgendaVote = async (agendaId) => {
    const ok = window.confirm('Завершить текущее и запустить новое голосование?');
    if (!ok) return;
    try {
      await endAgendaVote(agendaId);
      // Откроем модал запуска для этого же пункта
      setVoteModal({ open: true, agendaId });
    } catch (e) {
      // endAgendaVote уже показывает ошибку
    }
  };

  const resultsByAgenda = useMemo(() => {
    const map = new Map();
    for (const r of Array.isArray(results) ? results : []) {
      const key = r.agendaItemId ?? r.agendaId ?? r.itemId ?? null;
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return map;
  }, [results]);

  const renderResultsList = (item) => {
    const list = resultsByAgenda.get(item.id) || [];
    if (!list.length) return '-';
    const statusLabel = (s) => {
      if (!s) return '';
      if (s === 'PENDING') return 'Ожидает';
      if (s === 'ENDED') return 'Завершено';
      if (s === 'APPLIED') return 'Применено';
      if (s === 'CANCELLED') return 'Отменено';
      return s;
    };
    return (
      <div className="vote-results-list">
        {list.map((r) => (
          <div key={r.id} className={`vote-result-item status-${String(r.voteStatus || '').toLowerCase()}`}>
            {r.question ? (<div className="vri-title">{r.question}</div>) : null}
            <div className="vri-line">За - {r.votesFor} | Против - {r.votesAgainst} | Воздержались - {r.votesAbstain} | Не проголосовали - {r.votesAbsent}</div>
            {r.decision ? (
              <div className="vri-decision">
                Решение: <span style={{
                  fontWeight: 'bold',
                  color: r.decision === 'Принято' ? '#4caf50' : r.decision === 'Не принято' ? '#d32f2f' : 'inherit'
                }}>{r.decision}</span>
              </div>
            ) : null}
            {r.voteStatus ? (<div className="vri-status">Статус: {statusLabel(r.voteStatus)}</div>) : null}
            {r.televicResultsPending && (
              <div className="vri-televic-pending" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#856404'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #856404',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontWeight: 'bold' }}>Ожидание результатов от Televic CoCon...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const meetingUsers = useMemo(() => {
    // Use participants array if available (has location and proxy info)
    if (participants.length > 0) {
      return participants;
    }

    // Fallback to users from divisions
    if (!meeting?.divisions || !users?.length) return [];
    const divisionNames = new Set(String(meeting.divisions || '').split(',').map((s) => s.trim()).filter(Boolean));
    if (!divisionNames.size) return users;
    return users.filter((u) => divisionNames.has(String(u.divisionName || u.division || '')) || true);
  }, [participants, meeting, users]);

  return (
    <>
      <header className="page">
        <div className="header__top">
          <div className="container">
            <div className="wrapper">
              <div className="header__logo">
                <div className="logo__inner">
                  <a href="/hmau-vote/"><img src="/hmau-vote/img/logo.png" alt="" /></a>
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">

                  <ul>
                    <HeaderDropdown
                      trigger={(
                        <>
                          <img src="/hmau-vote/img/icon_2.png" alt="" />
                          {(() => { try { const a = JSON.parse(localStorage.getItem('authUser')||'null'); return a?.name || a?.email || 'admin@admin.ru'; } catch { return 'admin@admin.ru'; } })()}
                        </>
                      )}
                    >
                      <li>
                        <button type="button" className="logout-button" onClick={handleLogout}>Выйти</button>
                      </li>
                    </HeaderDropdown>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="header__menu">
          <div className="container">
            <div className="wrapper">
              <ul>
                <li><a href="/hmau-vote/users">Пользователи</a></li>
                <li><a href="/hmau-vote/divisions">Подразделения</a></li>
                <li><a href="/hmau-vote/meetings">Заседания</a></li>
                <li className="current-menu-item"><a href="/hmau-vote/console">Пульт заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/hmau-vote/template">Шаблоны голосования</a></li>
                    <li><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
                    <li><a href="/hmau-vote/vote">Процедура подсчёта голосов</a></li>
                    <li><a href="/hmau-vote/screen">Экран трансляции</a></li>
                    <li><a href="/hmau-vote/linkprofile">Связать профиль с ID</a></li>
                    <li><a href="/hmau-vote/contacts">Контакты</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              {/* Meeting timer at the top */}
              {meetingTimerLeft != null && (
                <div className="vote-timer" style={{ margin: '0 0 16px 0', padding: '12px 24px', backgroundColor: '#d1ecf1', border: '1px solid #17a2b8', borderRadius: '4px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#0c5460' }}>Таймер: {meetingTimerLeft} сек</span>
                  <button
                    onClick={handleStopTimer}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      color: '#0c5460',
                      cursor: 'pointer',
                      padding: '0 0 0 16px',
                      lineHeight: '1',
                      fontWeight: 'bold',
                      verticalAlign: 'middle',
                    }}
                    title="Остановить таймер"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Vote timer at the top */}
              {timeLeft != null && (
                <div className="vote-timer" style={{ margin: '0 0 16px 0', padding: '12px 24px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#856404' }}>Идёт голосование: Таймер обратного отсчёта: {timeLeft} сек</p>
                </div>
              )}

              <div className="page__top">
                <div className="top__heading" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h1>{meeting?.name || 'Заседание'}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {meeting?.status === 'COMPLETED' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-add no-add-icon"
                          disabled
                          title="Заседание завершено"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'not-allowed',
                            backgroundColor: '#f8d7da',
                            color: '#842029',
                            border: '1px solid #f5c2c7',
                            opacity: 1,
                          }}
                        >
                          <img src="/hmau-vote/img/icon_26.png" alt="Завершено" />
                          <span>Завершено</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-add"
                          onClick={() => setShowPdfDownload(true)}
                          title="Скачать результаты в PDF"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span>Результаты PDF</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`btn btn-add btn-meeting${meeting?.status === 'IN_PROGRESS' ? ' btn-stop' : ''}`}
                          onClick={startMeeting}
                          title={meeting?.status === 'IN_PROGRESS' ? 'Закончить заседание' : 'Начать заседание'}
                        >
                          <span>{meeting?.status === 'IN_PROGRESS' ? 'Закончить заседание' : 'Начать заседание'}</span>
                        </button>
                        <a
                          href={`/hmau-vote/console/meeting/${id}/screen`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-add btn-stream"
                        >
                          <span>Экран трансляции</span>
                        </a>
                        {(voteEndTime || endedResult || meeting?.showVoteOnBroadcast) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px', flex: 1 }}>
                            <span style={{
                              padding: '8px 12px',
                              backgroundColor: '#fff',
                              border: '2px solid #2196f3',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#333',
                              flex: 1,
                              textAlign: 'center'
                            }}>
                              {activeVoteQuestion || endedResult?.question || 'Голосование'}
                            </span>
                            <button
                              onClick={async () => {
                                try {
                                  // Turn OFF broadcast trigger (show agenda)
                                  await axios.put(`/api/meetings/${id}/show-vote`, { show: false });
                                } catch (err) {
                                  console.error('Failed to hide vote:', err);
                                }

                                // Clear the display
                                setEndedResult(null);
                                setActiveVoteQuestion(null);
                                setVoteError('');
                                setVoteEndTime(null);
                                setTimeLeft(null);
                              }}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#f44336',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                padding: 0,
                                lineHeight: 1
                              }}
                              title="Закрыть результаты голосования и вернуться к повестке"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
                <div className="page__table">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>Активный</th>
                        <th>Номер</th>
                        <th>Вопрос</th>
                        <th>Докладчик</th>
                        <th>Итоги голосования</th>
                        <th>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agenda || []).map((a, idx) => (
                        <tr key={a.id || idx} className={a.completed ? 'agenda-completed' : ''}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="radio"
                              name="activeAgendaItem"
                              checked={!!a.activeIssue}
                              onChange={async () => {
                                try {
                                  await apiRequest(`/api/meetings/${id}/agenda-items/${a.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                      number: a.number,
                                      title: a.title,
                                      speakerId: a.speakerId || null,
                                      link: a.link || null,
                                      activeIssue: true,
                                    }),
                                  });
                                  // Turn OFF broadcast trigger when switching agenda
                                  await axios.put(`/api/meetings/${id}/show-vote`, { show: false });
                                  setAgenda((prev) => (Array.isArray(prev) ? prev.map((it) => (
                                    it.id === a.id ? { ...it, activeIssue: true } : { ...it, activeIssue: false }
                                  )) : prev));
                                } catch (e) {
                                  alert(e.message || 'Не удалось установить активный вопрос');
                                }
                              }}
                              disabled={meeting?.status === 'COMPLETED' || a.completed}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: (meeting?.status === 'COMPLETED' || a.completed) ? 'not-allowed' : 'pointer',
                                accentColor: '#2b8af8',
                              }}
                            />
                          </td>
                          <td>{a.number ?? idx + 1}</td>
                          <td>{a.title}</td>
                          <td>{a.speaker || a.speakerId || ''}</td>
                          <td>{renderResultsList(a)}</td>
                          <td>
                          {meeting?.status !== 'COMPLETED' && (
                            <>
                              {/* Кнопка "Запустить голосование" - всегда зелёная */}
                              <button
                                className="btn btn-play"
                                title="Запустить голосование"
                                onClick={async () => {
                                  try {
                                    await apiRequest(`/api/meetings/${id}/agenda-items/${a.id}`, {
                                      method: 'PUT',
                                      body: JSON.stringify({
                                        number: a.number,
                                        title: a.title,
                                        speakerId: a.speakerId || null,
                                        link: a.link || null,
                                        activeIssue: true,
                                      }),
                                    });
                                  } catch {}
                                  setAgenda((prev) => (Array.isArray(prev) ? prev.map((it) => (
                                    it.id === a.id ? { ...it, activeIssue: true } : { ...it, activeIssue: false }
                                  )) : prev));
                                  setVoteModal({ open: true, agendaId: a.id });
                                }}
                                style={{ marginRight: 8, width: 'auto', minWidth: 'auto', padding: '6px 8px', marginTop: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <img src="/hmau-vote/img/icon_30.png" alt="Запустить голосование" />
                              </button>

                              {/* Кнопка "Завершить вопрос" - показывается когда вопрос активный */}
                              {a.activeIssue && (
                                <button
                                  className="btn btn-stop"
                                  title="Завершить вопрос"
                                  onClick={() => completeAgendaItem(a.id)}
                                  style={{ width: 'auto', minWidth: 'auto', padding: '6px 8px', marginTop: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <img src="/hmau-vote/img/icon_31.png" alt="Завершить вопрос" />
                                </button>
                              )}
                            </>
                          )}
                          {meeting?.status === 'COMPLETED' && (
                            <button
                              className="btn btn-add"
                              title="Скачать детальный PDF"
                              onClick={() => fetchDetailedVoteData(a.id)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                marginTop: 0,
                                minWidth: 'auto'
                              }}
                            >
                              <span>Детальный PDF</span>
                            </button>
                          )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {meeting?.status !== 'COMPLETED' && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-add"
                        onClick={() => setAddQuestionModal(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <span>Добавить вопрос</span>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <button
                      className="btn btn-add"
                      onClick={() => setTimerModal(true)}
                      title="Запустить таймер на экране трансляции"
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      <span>⏱ Запустить таймер</span>
                    </button>
                  </div>
                  <h2 style={{ margin: '0 0 12px' }}>Список участников</h2>
                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                    Всего участников: {meetingUsers.length} | В сети: {meetingUsers.filter(u => u.isOnline).length}
                  </div>
                  <div className="participants-table-wrapper">
                    <div className="page__table">
                      <table>
                        <thead>
                          <tr>
                            <th>ФИО</th>
                            <th>Статус</th>
                            <th style={{ width: '50px', textAlign: 'center' }}>Звук</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(meetingUsers || []).map((u) => (
                            <tr key={u.id}>
                              <td>
                                <div>
                                  {u.name} {u.location ? `(${u.location === 'HALL' ? 'Зал' : 'Сайт'})` : ''}
                                  {u.televicExternalId && (
                                    <span className="televic-badge-container">
                                      <span className="televic-badge" title={`Связан с Televic делегатом ${u.televicExternalId}`}>
                                        T
                                      </span>
                                      {u.isBadgeInserted && (
                                        <span className="badge-dot" title="Карточка вставлена"></span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                {u.proxy && (
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                    (по доверенности: {u.proxy.toUserName})
                                  </div>
                                )}
                                {u.receivedProxies && u.receivedProxies.length > 0 && (
                                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                    (по доверенности от: {u.receivedProxies.map(p => p.fromUserName).join(', ')})
                                  </div>
                                )}
                              </td>
                              <td className={`state state-${u.isOnline ? 'on' : 'off'}`}><span /></td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleMicrophoneToggle(u)}
                                  disabled={!u.televicExternalId}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: u.televicExternalId ? 'pointer' : 'not-allowed',
                                    padding: '0',
                                    lineHeight: '1',
                                    opacity: u.televicExternalId ? 1 : 0.5
                                  }}
                                  title={
                                    u.televicExternalId
                                      ? (u.muted === false ? 'Выключить звук' : 'Включить звук')
                                      : 'Пользователь не связан с Televic'
                                  }
                                >
                                  {u.muted === false ? '🔊' : '🔇'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Queue Block */}
                  <div style={{ marginTop: '2rem' }}>
                    <QueueBlock meetingId={id} durationTemplates={durationTemplates} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Окно "Итоги голосования" НЕ показывается т.к. результат применяется автоматически.
          Показывается только если автоматическое применение не сработало (для ручного управления). */}
      {endedResult && (
        <div className="vote-results" style={{ margin: '16px auto', maxWidth: 1100 }}>
          <h3>Итоги голосования</h3>
          <p>Название вопроса: {endedResult.question || '-'}</p>
          <p>За: {endedResult.votesFor}</p>
          <p>Против: {endedResult.votesAgainst}</p>
          <p>Воздержались: {endedResult.votesAbstain}</p>
          <p>Не проголосовали: {endedResult.votesAbsent}</p>
          {endedResult.decision ? (
            <p>
              <strong>Решение: </strong>
              <strong style={{
                color: endedResult.decision === 'Принято' ? '#4caf50' : endedResult.decision === 'Не принято' ? '#d32f2f' : 'inherit'
              }}>{endedResult.decision}</strong>
            </p>
          ) : null}
          {voteError ? (<div style={{ color: '#b71c1c', margin: '8px 0' }}>{voteError}</div>) : null}
          <div className="action-buttons" style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await apiRequest(`/api/vote-results/${endedResult.id}/apply`, { method: 'POST' });
                  setEndedResult(null);
                } catch (e) { setVoteError(e?.message || 'Не удалось применить'); }
              }}
            >
              Применить
            </button>
            <button
              className="btn"
              onClick={async () => {
                try {
                  await apiRequest(`/api/vote-results/${endedResult.id}/cancel`, { method: 'POST' });
                  setEndedResult(null);
                } catch (e) { setVoteError(e?.message || 'Не удалось отменить'); }
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <footer>
        <section id="footer">
          <div className="container">
            <div className="wrapper">
              <p>&copy; rms-group.ru</p>
              <p>RMS Voting 1.2 © 2025</p>
            </div>
          </div>
        </section>
      </footer>
      <StartVoteModal
        open={voteModal.open}
        agendaItemId={voteModal.agendaId}
        defaultProcedureId={meeting?.voteProcedureId}
        onStarted={(agendaId) =>
          setAgenda((prev) =>
            prev.map((it) =>
              it.id === agendaId ? { ...it, inVote: true, completed: false } : it
            )
          )
        }
        onClose={async (refresh) => {
          setVoteModal({ open: false, agendaId: null });
          if (refresh) {
            try {
              const ag = await getAgendaItems(id).catch(() => []);
              if (Array.isArray(ag)) {
                setAgenda((prev) => {
                  const prevMap = new Map((prev || []).map((p) => [p.id, p]));
                  return ag.map((item) => {
                    const old = prevMap.get(item.id) || {};
                    return {
                      ...item,
                      inVote: Boolean((item.inVote ?? item.voting ?? item.activeIssue ?? old.inVote)),
                      completed: Boolean(item.completed ?? old.completed),
                    };
                  });
                });
              }
            } catch {}
          }
        }}
      />

      {/* Модальное окно добавления вопроса */}
      {addQuestionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setAddQuestionModal(false);
            setNewQuestion({ title: '', speakerName: '' });
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 32,
              borderRadius: 8,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>Добавить вопрос</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Вопрос <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                placeholder="Введите название вопроса"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Докладчик
              </label>
              <input
                type="text"
                value={newQuestion.speakerName}
                onChange={(e) => setNewQuestion({ ...newQuestion, speakerName: e.target.value })}
                placeholder="Введите имя докладчика (необязательно)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setAddQuestionModal(false);
                  setNewQuestion({ title: '', speakerName: '' });
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Download Modal */}
      {showPdfDownload && meeting?.status === 'COMPLETED' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPdfDownload(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: 30,
              borderRadius: 8,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 20 }}>Скачать результаты голосования</h2>
            <p style={{ marginBottom: 20, color: '#666' }}>
              PDF документ будет содержать все результаты голосований по вопросам повестки заседания.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setShowPdfDownload(false)}
                style={{ backgroundColor: '#757575' }}
              >
                Отмена
              </button>
              <PDFDownloadLink
                document={
                  <VoteResultsPDF
                    meeting={meeting}
                    agendaItems={agenda}
                    voteResults={allVoteResults}
                    participants={participants}
                  />
                }
                fileName={`results_${meeting?.name || 'meeting'}_${new Date().toISOString().split('T')[0]}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) => (
                  <button
                    className="btn btn-add"
                    disabled={loading}
                    style={{
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    {loading ? 'Генерация PDF...' : 'Скачать PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}

      {/* Detailed PDF Modal for individual agenda item */}
      {detailedPdfData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDetailedPdfData(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: 30,
              borderRadius: 8,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 20 }}>Детальные результаты голосования</h2>
            <p style={{ marginBottom: 20, color: '#666' }}>
              PDF документ будет содержать детальные результаты всех голосований по вопросу "{detailedPdfData.agendaItem?.title}" с поименным списком голосующих.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setDetailedPdfData(null)}
                style={{ backgroundColor: '#757575' }}
              >
                Отмена
              </button>
              <PDFDownloadLink
                document={
                  <DetailedVoteResultsPDF
                    agendaItem={detailedPdfData.agendaItem}
                    meeting={detailedPdfData.meeting}
                    voteResults={detailedPdfData.voteResults}
                    participants={detailedPdfData.participants}
                  />
                }
                fileName={`detailed_vote_${detailedPdfData.agendaItem?.number || 'question'}_${new Date().toISOString().split('T')[0]}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) => (
                  <button
                    className="btn btn-add"
                    disabled={loading}
                    style={{
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    {loading ? 'Генерация PDF...' : 'Скачать PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}

      {/* Timer Modal */}
      <TimerModal
        open={timerModal}
        meetingId={id}
        onClose={() => setTimerModal(false)}
        onStart={handleStartTimer}
      />
    </>
  );
}

export default ControlMeetingPage;






