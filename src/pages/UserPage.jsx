import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  getMeetings,
  getMeeting,
  getAgendaItems,
  getUsers,
  logout as apiLogout,
  getActiveVoteResult,
  submitVote,
  submitVoteByResult,
  getVoteWeight,
  getVoteResults,
} from '../utils/api.js';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import UserQueueButtons from '../components/UserQueueButtons.jsx';
import MeetingResultsPDFButton from '../components/MeetingResultsPDFButton.jsx';
function useAuth() {
  try { const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const CHOICE_LABELS = {
  FOR: 'За',
  AGAINST: 'Против',
  ABSTAIN: 'Воздержусь',
};

function UserPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [users, setUsers] = useState([]);
  const [participants, setParticipants] = useState([]); // Participants with location and proxy info
  const [nextMeetingDate, setNextMeetingDate] = useState(null);
  const [activeVote, setActiveVote] = useState(null);
  const [isVoteModalOpen, setVoteModalOpen] = useState(false);
  const [voteDeadline, setVoteDeadline] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [changeDeadline, setChangeDeadline] = useState(null);
  const [changeSeconds, setChangeSeconds] = useState(null);
  const [voteLocked, setVoteLocked] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteWeight, setVoteWeight] = useState(null);
  const [receivedProxiesFrom, setReceivedProxiesFrom] = useState([]);
  const [voteResults, setVoteResults] = useState([]);
  const [isBadgeInserted, setIsBadgeInserted] = useState(false);
  const changeTimerRef = useRef(null);
  const changeCountdownRef = useRef(null);
  const meetingIdRef = useRef(null);
  const activeVoteRef = useRef(null);
  const normalizeAgendaItems = useCallback(
    (items) =>
      (Array.isArray(items)
        ? items.map((item) => ({
            ...item,
            activeIssue: Boolean(item?.activeIssue),
            completed: Boolean(item?.completed),
          }))
        : []),
    [],
  );
  const clearChangeTimers = useCallback(() => {
    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current);
      changeTimerRef.current = null;
    }
    if (changeCountdownRef.current) {
      clearInterval(changeCountdownRef.current);
      changeCountdownRef.current = null;
    }
    setChangeDeadline(null);
    setChangeSeconds(null);
  }, []);
  const sendVoteRequest = useCallback(async (choice) => {
    if (!auth?.id) throw new Error('Не удалось определить пользователя');
    const current = activeVoteRef.current || activeVote;
    if (!current) throw new Error('Нет активного голосования');
    if (current.id) {
      return submitVoteByResult({ userId: auth.id, voteResultId: current.id, choice });
    }
    if (current.agendaItemId) {
      return submitVote({ userId: auth.id, agendaItemId: current.agendaItemId, choice });
    }
    throw new Error('Недостаточно данных для голосования');
  }, [auth?.id, activeVote]);
  const openVoteModal = useCallback(async (data) => {
    if (!data) return;

    // Проверяем не истек ли таймер голосования
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    const duration = Number(data.duration) || 0;
    const deadline = duration > 0 ? createdAt.getTime() + duration * 1000 : null;

    if (deadline && Date.now() >= deadline) {
      console.log('⏰ Vote timer expired, not opening modal');
      return;
    }

    // Приоритет пульта: Если пользователь вставил карточку Televic, блокируем голосование на сайте
    // Проверяем напрямую через API для гарантии актуальности данных
    if (auth?.id) {
      try {
        const response = await fetch(`/api/users/${auth.id}`);
        const userData = await response.json();
        if (userData?.isBadgeInserted) {
          console.log('🎛️ User has badge inserted - voting blocked on website');
          // No alert needed - banner is displayed on page
          return;
        }
      } catch (err) {
        console.error('Failed to check badge status:', err);
        // Continue anyway if API call fails
      }
    }

    clearChangeTimers();
    const normalized = {
      ...data,
      createdAt: createdAt.toISOString(),
      duration,
    };
    setActiveVote(normalized);
    setVoteDeadline(deadline);
    setRemainingSeconds(() => {
      if (!deadline) return null;
      const diff = deadline - Date.now();
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    });
    setVoteModalOpen(true);
    setVoteLocked(false);
    setSelectedChoice(null);
    setVoteError('');

    // Загружаем вес голоса
    if (meetingIdRef.current && auth?.id) {
      try {
        const weightData = await getVoteWeight(meetingIdRef.current, auth.id);
        setVoteWeight(weightData.voteWeight);
        setReceivedProxiesFrom(weightData.receivedFrom || []);
      } catch (err) {
        console.error('Ошибка загрузки веса голоса:', err);
        setVoteWeight(1);
        setReceivedProxiesFrom([]);
      }
    } else {
      setVoteWeight(1);
      setReceivedProxiesFrom([]);
    }

    setAgenda((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((item) => {
        if (!item) return item;
        if (item.id === data.agendaItemId) {
          return { ...item, activeIssue: true, voting: true };
        }
        return { ...item, activeIssue: false };
      });
    });
  }, [clearChangeTimers, auth?.id]);
  const finalizeChoice = useCallback(async (choice) => {
    if (!choice || !activeVoteRef.current) return;
    try {
      await sendVoteRequest(choice);
    } catch (err) {
      setVoteError(err?.message || 'Не удалось зафиксировать голос');
    } finally {
      setVoteLocked(true);
      clearChangeTimers();
    }
  }, [clearChangeTimers, sendVoteRequest]);
  const onVoteEnded = useCallback((data) => {
    clearChangeTimers();
    setVoteModalOpen(false);
    setVoteDeadline(null);
    setRemainingSeconds(null);
    setVoteLocked(true);
    setSelectedChoice(null);
    const agendaItemId = data?.agendaItemId || activeVoteRef.current?.agendaItemId || null;
    setAgenda((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((item) => {
        if (!item) return item;
        if (agendaItemId && item.id === agendaItemId) {
          return { ...item, activeIssue: false, completed: true, voting: false };
        }
        return { ...item, activeIssue: false };
      });
    });
    setActiveVote(null);
  }, [clearChangeTimers]);
  const onVoteCleared = useCallback((data) => {
    clearChangeTimers();
    setVoteModalOpen(false);
    setVoteDeadline(null);
    setRemainingSeconds(null);
    setVoteLocked(false);
    setSelectedChoice(null);
    const agendaItemId = data?.agendaItemId || activeVoteRef.current?.agendaItemId || null;
    const applied = data?.voteStatus === 'APPLIED';
    setAgenda((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((item) => {
        if (!item) return item;
        if (agendaItemId && item.id === agendaItemId) {
          return {
            ...item,
            activeIssue: false,
            voting: false,
            completed: applied ? true : item.completed,
          };
        }
        return { ...item, activeIssue: false };
      });
    });
    setActiveVote(null);
  }, [clearChangeTimers]);
  const handleSelectChoice = useCallback(async (choice) => {
    if (!choice || voteLocked) return;
    console.log('🔵 handleSelectChoice called with:', choice);
    setVoteError('');
    setSelectedChoice(choice);
    console.log('🔵 selectedChoice set to:', choice);

    // Отправляем голос сразу, можно менять до конца таймера голосования
    try {
      await sendVoteRequest(choice);
      console.log('✅ Vote request successful');
    } catch (err) {
      console.error('❌ Vote request failed:', err);
      setVoteError(err?.message || 'Не удалось отправить голос');
    }
  }, [sendVoteRequest, voteLocked]);
  const formatTime = useCallback((totalSeconds) => {
    if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.max(0, totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);
  const formatMeetingDate = useCallback((date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }, []);
  useEffect(() => {
    if (!changeDeadline || voteLocked) {
      if (changeCountdownRef.current) {
        clearInterval(changeCountdownRef.current);
        changeCountdownRef.current = null;
      }
      if (!voteLocked) setChangeSeconds(null);
      return;
    }
    const update = () => {
      const diff = changeDeadline - Date.now();
      const seconds = diff > 0 ? Math.ceil(diff / 1000) : 0;
      setChangeSeconds(seconds);
      if (diff <= 0 && changeCountdownRef.current) {
        clearInterval(changeCountdownRef.current);
        changeCountdownRef.current = null;
      }
    };
    update();
    if (changeCountdownRef.current) {
      clearInterval(changeCountdownRef.current);
    }
    changeCountdownRef.current = setInterval(update, 250);
    return () => {
      if (changeCountdownRef.current) {
        clearInterval(changeCountdownRef.current);
        changeCountdownRef.current = null;
      }
    };
  }, [changeDeadline, voteLocked]);
  useEffect(() => {
    if (!isVoteModalOpen || !voteDeadline) {
      setRemainingSeconds(null);
      return undefined;
    }
    const update = () => {
      const diff = voteDeadline - Date.now();
      const seconds = diff > 0 ? Math.ceil(diff / 1000) : 0;

      if (diff <= 0) {
        // Clear timer first to avoid showing "00:00"
        setRemainingSeconds(null);
        clearChangeTimers();
        setVoteModalOpen(false);
        setVoteDeadline(null);
        setActiveVote(null);
        setVoteLocked(true);
        setSelectedChoice(null);
        setAgenda((prev) => {
          if (!Array.isArray(prev)) return prev;
          const agendaItemId = activeVoteRef.current?.agendaItemId;
          return prev.map((item) => {
            if (!item) return item;
            if (agendaItemId && item.id === agendaItemId) {
              return { ...item, activeIssue: false, voting: false };
            }
            return { ...item, activeIssue: false };
          });
        });
      } else {
        setRemainingSeconds(seconds);
      }
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [clearChangeTimers, isVoteModalOpen, voteDeadline]);
  useEffect(() => () => {
    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current);
      changeTimerRef.current = null;
    }
    if (changeCountdownRef.current) {
      clearInterval(changeCountdownRef.current);
      changeCountdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [ms, us] = await Promise.all([getMeetings().catch(() => []), getUsers().catch(() => [])]);
        const normalizedUsers = Array.isArray(us) ? us : [];
        if (isMounted) {
          setUsers(normalizedUsers);
        }

        const allMeetings = Array.isArray(ms) ? ms : [];
        const normalizedEmail = typeof auth?.email === 'string' ? auth.email.trim().toLowerCase() : null;
        const currentUser = normalizedEmail
          ? normalizedUsers.find((u) => typeof u?.email === 'string' && u.email.trim().toLowerCase() === normalizedEmail)
          : null;
        const candidateTokens = [
          auth?.email,
          currentUser?.email,
          currentUser?.name,
          currentUser?.division,
          currentUser?.divisionName,
        ]
          .filter((value) => typeof value === 'string' && value.trim())
          .map((value) => value.trim().toLowerCase());
        const hasUserInMeeting = (meetingItem) => {
          if (!meetingItem) return false;
          if (!candidateTokens.length) return false;

          // Handle divisions as array of objects (new format)
          if (Array.isArray(meetingItem.divisions)) {
            const divisionNames = meetingItem.divisions.map(d => (d.name || '').trim().toLowerCase()).filter(Boolean);
            return candidateTokens.some(token => divisionNames.some(name => name.includes(token) || token.includes(name)));
          }

          // Handle divisions as string (old format)
          if (typeof meetingItem.divisions === 'string') {
            const raw = meetingItem.divisions.trim();
            if (!raw || raw.toLowerCase() === 'нет') return false;
            const divisionTokens = raw
              .split(',')
              .map((part) => part.trim().toLowerCase())
              .filter(Boolean);
            if (divisionTokens.some((token) => candidateTokens.includes(token))) return true;
            const lowered = raw.toLowerCase();
            return candidateTokens.some((token) => lowered.includes(token));
          }

          return false;
        };

        const now = Date.now();
        const upcoming = allMeetings
          .map((item) => ({ item, start: item?.startTime ? new Date(item.startTime) : null }))
          .filter(({ item, start }) => {
            if (!start || Number.isNaN(start.getTime())) return false;
            if (start.getTime() < now) return false;
            return hasUserInMeeting(item);
          })
          .sort((a, b) => a.start - b.start)[0];
        if (isMounted) {
          setNextMeetingDate(upcoming?.start ? formatMeetingDate(upcoming.start) : null);
        }

        const activeMeeting = allMeetings.find((entry) => entry?.status === 'IN_PROGRESS') || null;

        // Check if there's a completed meeting that user participated in
        const completedMeeting = allMeetings.find((entry) => entry?.status === 'COMPLETED' && hasUserInMeeting(entry)) || null;

        if (completedMeeting && !activeMeeting) {
          // Redirect to protocol page for completed meeting
          if (isMounted) {
            console.log('📋 Meeting completed, redirecting to protocol page');
            navigate(`/report/meeting/${completedMeeting.id}`, { replace: true });
          }
          return;
        }

        if (activeMeeting) {
          const [full, ag, results] = await Promise.all([
            getMeeting(activeMeeting.id).catch(() => null),
            getAgendaItems(activeMeeting.id).catch(() => []),
            getVoteResults(activeMeeting.id).catch(() => []),
          ]);
          if (!isMounted) return;
          const agendaItems = Array.isArray(ag) && ag.length ? ag : (full?.agendaItems || []);
          setMeeting(full || activeMeeting);
          setAgenda(normalizeAgendaItems(agendaItems));
          // Show all vote results (PENDING, ENDED, APPLIED, CANCELLED) just like admin
          console.log('📊 Loaded vote results:', results);
          setVoteResults(Array.isArray(results) ? results : []);

          // Load participants with location and proxy info
          try {
            const participantsRes = await fetch(`/api/meetings/${activeMeeting.id}/participants`);
            const participantsData = await participantsRes.json();
            setParticipants(Array.isArray(participantsData?.participants) ? participantsData.participants : []);
          } catch (err) {
            console.error('Failed to load participants:', err);
          }
        } else if (isMounted) {
          setMeeting(null);
          setAgenda([]);
          setVoteResults([]);
          setParticipants([]);
        }
      } catch {
        if (!isMounted) return;
        setUsers([]);
        setMeeting(null);
        setAgenda([]);
        setNextMeetingDate(null);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [auth?.email, formatMeetingDate, normalizeAgendaItems]);

  useEffect(() => {
    meetingIdRef.current = meeting?.id ? String(meeting.id) : null;
  }, [meeting?.id]);
  useEffect(() => {
    activeVoteRef.current = activeVote;
  }, [activeVote]);
  useEffect(() => {
    if (!meeting?.id) return;
    (async () => {
      try {
        const pending = await getActiveVoteResult(meeting.id).catch(() => null);
        // Открываем модалку только если она еще не открыта
        if (pending && !isVoteModalOpen) {
          console.log('📢 Opening vote modal from pending result');
          openVoteModal(pending);
        }
      } catch {}
    })();
  }, [meeting?.id, openVoteModal, isVoteModalOpen]);
  useEffect(() => {
    if (!meeting?.id) return undefined;
    const socket = io();

    const handleNewVote = (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;
      if (meetingId && !data?.meetingId && activeVoteRef.current?.meetingId && String(activeVoteRef.current.meetingId) !== meetingId) return;
      if (data?.voteStatus && data.voteStatus !== 'PENDING') return;

      // Не переоткрываем модалку если она уже открыта для того же голосования
      if (isVoteModalOpen && activeVoteRef.current?.id === data?.id) {
        console.log('⏭️ Skipping openVoteModal - already open for same vote');
        return;
      }

      console.log('📢 Opening vote modal from socket event');
      openVoteModal(data);
    };

    const handleEnded = (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;
      onVoteEnded(data);
    };

    const handleCleared = async (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;
      onVoteCleared(data);
      // Reload vote results when a vote is applied
      if (meeting?.id) {
        try {
          const results = await getVoteResults(meeting.id).catch(() => []);
          console.log('📊 Reloaded vote results after apply:', results);
          setVoteResults(Array.isArray(results) ? results : []);
        } catch {}
      }
    };

    const handleAgendaItemUpdated = (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;

      // Update agenda to reflect activeIssue change
      setAgenda((prev) =>
        Array.isArray(prev)
          ? prev.map((item) =>
              item.id === data.agendaItemId
                ? { ...item, activeIssue: data.activeIssue, completed: data.completed }
                : { ...item, activeIssue: false }
            )
          : prev
      );
    };

    const handleMeetingStatusChanged = (data) => {
      // When meeting is completed, redirect to report page
      if (data?.status === 'COMPLETED' && data?.id === meeting?.id) {
        navigate(`/hmau-vote/report/meeting/${data.id}`, { replace: true });
      }
    };

    const handleAgendaItemAdded = (data) => {
      // Add new agenda item to the list if it belongs to current meeting
      if (data?.meetingId === meeting?.id && data?.agendaItem) {
        setAgenda(prev => {
          // Check if item already exists (avoid duplicates)
          const exists = prev.some(item => item.id === data.agendaItem.id);
          if (exists) return prev;
          // Add new item and sort by number
          return [...prev, data.agendaItem].sort((a, b) => a.number - b.number);
        });
      }
    };

    socket.on('new-vote-result', handleNewVote);
    socket.on('vote-ended', handleEnded);
    socket.on('vote-applied', handleCleared);
    socket.on('vote-cancelled', handleCleared);
    socket.on('agenda-item-updated', handleAgendaItemUpdated);
    socket.on('meeting-status-changed', handleMeetingStatusChanged);
    socket.on('agenda-item-added', handleAgendaItemAdded);

    return () => {
      socket.off('new-vote-result', handleNewVote);
      socket.off('vote-ended', handleEnded);
      socket.off('vote-applied', handleCleared);
      socket.off('vote-cancelled', handleCleared);
      socket.off('agenda-item-updated', handleAgendaItemUpdated);
      socket.off('meeting-status-changed', handleMeetingStatusChanged);
      socket.off('agenda-item-added', handleAgendaItemAdded);
      socket.disconnect();
    };
  }, [meeting?.id, onVoteCleared, onVoteEnded, openVoteModal, isVoteModalOpen, navigate]);

  const meetingUsers = useMemo(() => {
    // Use participants array if available (has location and proxy info)
    if (participants.length > 0) {
      return participants;
    }

    // Fallback to old logic
    if (!meeting?.divisions) return [];

    // Handle divisions as array of objects (new format)
    if (Array.isArray(meeting.divisions)) {
      // If divisions have users included, extract them
      const usersFromDivisions = meeting.divisions.flatMap(d => Array.isArray(d.users) ? d.users : []);
      if (usersFromDivisions.length > 0) {
        return usersFromDivisions;
      }

      // Otherwise filter global users by divisionId
      if (users?.length) {
        const divisionIds = new Set(meeting.divisions.map(d => d.id));
        return users.filter(u => divisionIds.has(u.divisionId));
      }
    }

    // Handle divisions as string (old format)
    if (typeof meeting.divisions === 'string' && users?.length) {
      const divisionNames = new Set((meeting.divisions || '').split(',').map(s => s.trim()).filter(Boolean));
      return users.filter(u => divisionNames.size ? divisionNames.has(String(u.divisionName || u.division || '')) || true : true);
    }

    return [];
  }, [participants, meeting, users]);

  // Group vote results by agendaItemId
  const resultsByAgenda = useMemo(() => {
    const map = new Map();
    for (const r of voteResults) {
      const key = r.agendaItemId;
      if (key == null) continue;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return map;
  }, [voteResults]);

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
          <div key={r.id} className={`vote-result-item status-${String(r.voteStatus || r.status || '').toLowerCase()}`}>
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
            {(r.voteStatus || r.status) ? (<div className="vri-status">Статус: {statusLabel(r.voteStatus || r.status)}</div>) : null}
          </div>
        ))}
      </div>
    );
  };

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try { if (auth?.username || auth?.email) await apiLogout(auth.username, auth.email); } catch {}
    localStorage.removeItem('authUser');
    navigate('/login', { replace: true });
  };

  // Also listen for forced disconnects and logout
  useEffect(() => {
    const socket = io();
    const onStatus = (data) => {
      try {
        const sameId = Number(auth?.id) === Number(data?.userId);
        const sameEmail = auth?.email && data?.email && String(auth.email).toLowerCase() === String(data.email).toLowerCase();
        if (!auth?.isAdmin && (sameId || sameEmail) && data?.isOnline === false) {
          try { localStorage.removeItem('authUser'); } catch {}
          navigate('/login', { replace: true });
        }
        // Update participants online status
        setParticipants((prev) => prev.map((u) => (u.id === data?.userId ? { ...u, isOnline: !!data.isOnline } : u)));
      } catch {}
    };
    const onBadgeStatusChanged = (data) => {
      setParticipants((prev) => prev.map((u) =>
        u.id === data?.userId ? { ...u, isBadgeInserted: data.isBadgeInserted } : u
      ));
      // Update current user's badge status for banner display
      if (data?.userId === auth?.id) {
        setIsBadgeInserted(data.isBadgeInserted);
      }
    };
    socket.on('user-status-changed', onStatus);
    socket.on('badge-status-changed', onBadgeStatusChanged);
    return () => {
      socket.off('user-status-changed', onStatus);
      socket.off('badge-status-changed', onBadgeStatusChanged);
      socket.disconnect();
    };
  }, [auth?.id, auth?.email, auth?.isAdmin, navigate]);
  const voteTitle = activeVote?.templateTitle || activeVote?.question || 'Голосование';
  const voteQuestion = activeVote?.question && activeVote.question !== voteTitle ? activeVote.question : null;
  return (
    <>
      <header className="page">
        <div className="header__top">
          <div className="container">
            <div className="wrapper">
              <div className="header__logo">
                <div className="logo__inner">
                  <img src="/hmau-vote/img/logo.png" alt="" style={{ cursor: 'default' }} />
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">

                  <ul>
                    <HeaderDropdown
                      trigger={(<><img src="/hmau-vote/img/icon_2.png" alt="" />{auth?.name || auth?.email || 'user'}</>)}
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
      </header>
      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              <div className="page__top">
                {isBadgeInserted && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '14px 18px',
                    backgroundColor: '#e3f2fd',
                    border: '2px solid #2196F3',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#0d47a1'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>
                      Вы вставили карточку в пульт Televic. Голосование доступно только через пульт.
                    </span>
                  </div>
                )}
                <div className="top__heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h1>{meeting?.name || 'Заседание'}</h1>
                </div>
              </div>
              {meeting ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                  <div>
                    <h2 style={{ margin: '0 0 12px' }}>Вопросы повестки:</h2>
                    <div className="page__table">
                      <table>
                        <thead>
                          <tr>
                            <th>Номер</th>
                            <th>Вопрос</th>
                            <th>Докладчик</th>
                            <th>Итоги голосования</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(agenda || []).map((a, idx) => (
                            <tr key={a.id || idx} className={a.activeIssue ? 'agenda-active' : undefined}>
                              <td>{a.number ?? idx + 1}</td>
                              <td>{a.title}</td>
                              <td>{a.speaker || a.speakerId || '-'}</td>
                              <td>{renderResultsList(a)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PDF Results Button - only shown when meeting is completed */}
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                      <MeetingResultsPDFButton meeting={meeting} agenda={agenda} />
                    </div>
                  </div>
                  <div>
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
                            </tr>
                          </thead>
                          <tbody>
                            {(meetingUsers || []).map(u => (
                              <tr key={u.id}>
                                <td>
                                  <div>
                                    {u.name} {u.location ? `(${u.location === 'HALL' ? 'Зал' : 'Сайт'})` : ''}
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
                                <td className={`state state-${u.isBadgeInserted ? 'televic' : (u.isOnline ? 'on' : 'off')}`}><span /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Queue Buttons */}
                    <div style={{ marginTop: '2rem' }}>
                      <UserQueueButtons meetingId={meeting?.id} userId={auth?.id} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-meeting-wrapper">
                  <div className="no-meeting-banner">
                    Нет активных заседаний, ближайшее: {nextMeetingDate || '—'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
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
      {isVoteModalOpen && activeVote ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="vote-modal-title">
          <div className="modal-content vote-modal">
            <h2 id="vote-modal-title">{voteTitle}</h2>
            {voteQuestion ? <p className="vote-modal__question">{voteQuestion}</p> : null}
            <div className="vote-modal__timer">
              Осталось времени: <span>{formatTime(remainingSeconds ?? (activeVote?.duration || 0))}</span>
            </div>
            {voteWeight && voteWeight > 1 ? (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
                  Вес вашего голоса: {voteWeight}
                </div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  Вы голосуете за: себя + {receivedProxiesFrom.map(p => p.name).join(', ')}
                </div>
              </div>
            ) : null}
            <div className="vote-modal__options">
              {console.log('🎨 RENDER: selectedChoice=', selectedChoice, 'voteLocked=', voteLocked)}
              <button
                type="button"
                className={`vote-choice-button vote-choice-button--for${selectedChoice === 'FOR' ? ' selected' : ''}${voteLocked ? ' locked' : ''}`}
                onClick={() => handleSelectChoice('FOR')}
                disabled={voteLocked}
                data-selected={selectedChoice === 'FOR'}
              >
                За
              </button>
              <button
                type="button"
                className={`vote-choice-button vote-choice-button--against${selectedChoice === 'AGAINST' ? ' selected' : ''}${voteLocked ? ' locked' : ''}`}
                onClick={() => handleSelectChoice('AGAINST')}
                disabled={voteLocked}
              >
                Против
              </button>
              <button
                type="button"
                className={`vote-choice-button vote-choice-button--abstain${selectedChoice === 'ABSTAIN' ? ' selected' : ''}${voteLocked ? ' locked' : ''}`}
                onClick={() => handleSelectChoice('ABSTAIN')}
                disabled={voteLocked}
              >
                Воздержусь
              </button>
            </div>
            <div className="vote-modal__hint">
              {selectedChoice ? (
                voteLocked ? (
                  <span>Ваш выбор «{CHOICE_LABELS[selectedChoice]}» зафиксирован.</span>
                ) : (
                  <span>
                    Вы выбрали «{CHOICE_LABELS[selectedChoice]}». Вы можете изменить выбор до окончания голосования.
                  </span>
                )
              ) : (
                <span>Сделайте выбор, нажав одну из кнопок.</span>
              )}
            </div>
            {voteError ? <div className="vote-modal__error">{voteError}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
export default UserPage;

