import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeetings, getMeeting, getAgendaItems, getUsers, logout as apiLogout } from '../utils/api.js';
function useAuth() {
  try { const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function UserPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [ms, us] = await Promise.all([getMeetings().catch(() => []), getUsers().catch(() => [])]);
        setUsers(Array.isArray(us) ? us : []);
        const all = Array.isArray(ms) ? ms : [];
        let m = all.find(x => x.status === 'IN_PROGRESS') || all[0] || null;
        if (m) {
          const full = await getMeeting(m.id).catch(() => null);
          setMeeting(full || m);
          const ag = await getAgendaItems(m.id).catch(() => []);
          setAgenda(Array.isArray(ag) && ag.length ? ag : (full?.agendaItems || []));
        }
      } catch {}
    })();
  }, []);
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
                    <li className="menu-children">
                      <a href="#!"><img src="/img/icon_2.png" alt="" />{auth?.email || 'user'}</a>
                      <ul className="sub-menu">
                        <li>
                          <button type="button" className="logout-button" onClick={handleLogout}>Выйти</button>
                        </li>
                      </ul>
                    </li>
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
                          <tr key={a.id || idx}>
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
export default UserPage;

