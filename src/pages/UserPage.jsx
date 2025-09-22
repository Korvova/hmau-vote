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
} from '../utils/api.js';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
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
    if (!auth?.email) throw new Error('Не удалось определить пользователя');
    const current = activeVoteRef.current || activeVote;
    if (!current) throw new Error('Нет активного голосования');
    if (current.id) {
      return submitVoteByResult({ userId: auth.email, voteResultId: current.id, choice });
    }
    if (current.agendaItemId) {
      return submitVote({ userId: auth.email, agendaItemId: current.agendaItemId, choice });
    }
    throw new Error('Недостаточно данных для голосования');
  }, [auth?.email, activeVote]);
  const openVoteModal = useCallback((data) => {
    if (!data) return;
    clearChangeTimers();
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    const duration = Number(data.duration) || 0;
    const normalized = {
      ...data,
      createdAt: createdAt.toISOString(),
      duration,
    };
    const deadline = duration > 0 ? createdAt.getTime() + duration * 1000 : null;
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
  }, [clearChangeTimers]);
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
    setVoteError('');
    setSelectedChoice(choice);
    const deadline = Date.now() + 5000;
    setChangeDeadline(deadline);
    setChangeSeconds(5);
    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current);
    }
    changeTimerRef.current = setTimeout(() => {
      finalizeChoice(choice);
    }, 5000);
    try {
      await sendVoteRequest(choice);
    } catch (err) {
      setVoteError(err?.message || 'Не удалось отправить голос');
    }
  }, [finalizeChoice, sendVoteRequest, voteLocked]);
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
      setRemainingSeconds(seconds);
      if (diff <= 0) {
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
          if (!meetingItem || typeof meetingItem.divisions !== 'string') return false;
          const raw = meetingItem.divisions.trim();
          if (!raw || raw.toLowerCase() === 'нет') return false;
          if (!candidateTokens.length) return false;
          const divisionTokens = raw
            .split(',')
            .map((part) => part.trim().toLowerCase())
            .filter(Boolean);
          if (divisionTokens.some((token) => candidateTokens.includes(token))) return true;
          const lowered = raw.toLowerCase();
          return candidateTokens.some((token) => lowered.includes(token));
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
        if (activeMeeting) {
          const [full, ag] = await Promise.all([
            getMeeting(activeMeeting.id).catch(() => null),
            getAgendaItems(activeMeeting.id).catch(() => []),
          ]);
          if (!isMounted) return;
          const agendaItems = Array.isArray(ag) && ag.length ? ag : (full?.agendaItems || []);
          setMeeting(full || activeMeeting);
          setAgenda(normalizeAgendaItems(agendaItems));
        } else if (isMounted) {
          setMeeting(null);
          setAgenda([]);
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
        if (pending) {
          openVoteModal(pending);
        }
      } catch {}
    })();
  }, [meeting?.id, openVoteModal]);
  useEffect(() => {
    if (!meeting?.id) return undefined;
    const socket = io();

    const handleNewVote = (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;
      if (meetingId && !data?.meetingId && activeVoteRef.current?.meetingId && String(activeVoteRef.current.meetingId) !== meetingId) return;
      if (data?.voteStatus && data.voteStatus !== 'PENDING') return;
      openVoteModal(data);
    };

    const handleEnded = (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;
      onVoteEnded(data);
    };

    const handleCleared = (data) => {
      const meetingId = meetingIdRef.current;
      if (meetingId && data?.meetingId && String(data.meetingId) !== meetingId) return;
      onVoteCleared(data);
    };

    socket.on('new-vote-result', handleNewVote);
    socket.on('vote-ended', handleEnded);
    socket.on('vote-applied', handleCleared);
    socket.on('vote-cancelled', handleCleared);

    return () => {
      socket.off('new-vote-result', handleNewVote);
      socket.off('vote-ended', handleEnded);
      socket.off('vote-applied', handleCleared);
      socket.off('vote-cancelled', handleCleared);
      socket.disconnect();
    };
  }, [meeting?.id, onVoteCleared, onVoteEnded, openVoteModal]);

  const meetingUsers = useMemo(() => {
    if (!meeting?.divisions || !users?.length) return [];
    const divisionNames = new Set((meeting.divisions || '').split(',').map(s => s.trim()).filter(Boolean));
    return users.filter(u => divisionNames.size ? divisionNames.has(String(u.divisionName || u.division || '')) || true : true);
  }, [meeting, users]);
  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try { if (auth?.email) await apiLogout(auth.email); } catch {}
    localStorage.removeItem('authUser');
    navigate('/login', { replace: true });
  };
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
                  <a href="/"><img src="/img/logo.png" alt="" /></a>
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">
                  <a href="#!" className="support"><img src="/img/icon_1.png" alt="" />Поддержка</a>
                  <ul>
                    <HeaderDropdown
                      trigger={(<><img src="/img/icon_2.png" alt="" />{auth?.email || 'user'}</>)}
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
                            <th>Ссылка</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(agenda || []).map((a, idx) => (
                            <tr key={a.id || idx} className={a.activeIssue ? 'agenda-active' : undefined}>
                              <td>{a.number ?? idx + 1}</td>
                              <td>{a.title}</td>
                              <td>{a.speaker || a.speakerId || '-'}</td>
                              <td>{a.link || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 12px' }}>Список участников</h2>
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
                              <td>{u.name}</td>
                              <td className={`state state-${u.isOnline ? 'on' : 'off'}`}><span /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
            <div className="vote-modal__options">
              <button
                type="button"
                className={`vote-choice-button vote-choice-button--for${selectedChoice === 'FOR' ? ' selected' : ''}${voteLocked ? ' locked' : ''}`}
                onClick={() => handleSelectChoice('FOR')}
                disabled={voteLocked}
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
                    Вы выбрали «{CHOICE_LABELS[selectedChoice]}». Изменить решение можно ещё{' '}
                    {changeSeconds ?? 0} сек.
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

