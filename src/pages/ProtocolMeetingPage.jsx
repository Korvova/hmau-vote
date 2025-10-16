import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../utils/socket.js';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import MeetingResultsPDFButton from '../components/MeetingResultsPDFButton.jsx';
import { getMeeting, getAgendaItems, getUsers, getVoteResults, logout as apiLogout } from '../utils/api.js';

function ProtocolMeetingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
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

  useEffect(() => {
    (async () => {
      try {
        const [m, ag, us, rs] = await Promise.all([
          getMeeting(id).catch(() => null),
          getAgendaItems(id).catch(() => []),
          getUsers().catch(() => []),
          getVoteResults(id).catch(() => []),
        ]);
        setMeeting(m);
        const items = Array.isArray(ag) && ag.length ? ag : (Array.isArray(m?.agendaItems) ? m.agendaItems : []);
        setAgenda(items || []);
        setUsers(Array.isArray(us) ? us : []);
        setResults(Array.isArray(rs) ? rs : []);
      } catch {}
    })();
  }, [id]);

  // Listen for meeting status changes and redirect non-admin users to active meeting
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('authUser') || 'null');
      if (auth?.isAdmin) return; // Admins don't need auto-redirect

      socket.on('meeting-status-changed', (data) => {
        console.log('Meeting status changed:', data);
        // If ANY meeting started (status changed to IN_PROGRESS), redirect to /user
        // data contains { id, status } from the server
        if (data?.status === 'IN_PROGRESS' && data?.id) {
          console.log('Redirecting to /user because meeting', data.id, 'started');
          navigate('/hmau-vote/user', { replace: true });
        }
      });

      return () => {
        socket.off('meeting-status-changed');
      };
    } catch (err) {
      console.error('Socket setup error:', err);
    }
  }, [id, navigate]);

  const usersMap = useMemo(() => Object.fromEntries((users || []).map(u => [u.id, u.name])), [users]);

  // Group vote results by agenda item (same as UserPage)
  const resultsByAgenda = useMemo(() => {
    const map = new Map();
    for (const r of results || []) {
      const key = r.agendaItemId ?? r.agendaId ?? r.itemId;
      if (key == null) continue;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    // Sort by creation date
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
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
          <div key={r.id} className={`vote-result-item status-${String(r.voteStatus || r.status || '').toLowerCase()}`}>
            {r.question ? (<div className="vri-title">{r.question}</div>) : null}
            <div className="vri-line">За - {r.votesFor || 0} | Против - {r.votesAgainst || 0} | Воздержались - {r.votesAbstain || 0} | Не проголосовали - {r.votesAbsent || 0}</div>
            {r.decision ? (
              <div className="vri-decision">
                Решение: <span style={{
                  fontWeight: 'bold',
                  color: r.decision === 'Принято' || r.decision === 'Решение ПРИНЯТО' ? '#4caf50' :
                         r.decision === 'Не принято' || r.decision === 'Решение НЕ ПРИНЯТО' ? '#d32f2f' : 'inherit'
                }}>{r.decision}</span>
              </div>
            ) : null}
            {(r.voteStatus || r.status) ? (<div className="vri-status">Статус: {statusLabel(r.voteStatus || r.status)}</div>) : null}
          </div>
        ))}
      </div>
    );
  };

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
                {(() => {
                  try {
                    const auth = JSON.parse(localStorage.getItem('authUser') || 'null');
                    const isAdmin = auth?.isAdmin;
                    if (!isAdmin) {
                      // For regular users, show only "Заседания"
                      return <li><a href="/hmau-vote/meetings">Заседания</a></li>;
                    }
                    // For admins, show full menu
                    return (
                      <>
                        <li><a href="/hmau-vote/users">Пользователи</a></li>
                        <li><a href="/hmau-vote/divisions">Подразделения</a></li>
                        <li><a href="/hmau-vote/meetings">Заседания</a></li>
                        <li><a href="/hmau-vote/console">Пульт заседания</a></li>
                        <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                          <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                          <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                            <li><a href="/hmau-vote/template">Шаблоны голосования</a></li>
                            <li><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
                            <li><a href="/hmau-vote/vote">Процедуры принятия решений</a></li>
                            <li><a href="/hmau-vote/screen">Экран трансляции</a></li>
                            <li><a href="/hmau-vote/linkprofile">Привязка профиля к ID</a></li>
                          </ul>
                        </li>
                      </>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </ul>
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
                  <h1>Протокол заседания: <span style={{ fontWeight: 700 }}>{meeting?.name || ''}</span></h1>
                  <MeetingResultsPDFButton meeting={meeting} agenda={agenda} />
                </div>
              </div>

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
                      <tr key={a.id || idx}>
                        <td>{a.number ?? (idx + 1)}</td>
                        <td>{a.title}</td>
                        <td>{a.speaker || usersMap[a.speakerId] || ''}</td>
                        <td>{renderResultsList(a)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </>
  );
}

export default ProtocolMeetingPage;
