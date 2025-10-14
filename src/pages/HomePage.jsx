import React, { useEffect, useMemo, useState } from 'react';
import { getMeetings, getUsers, logout as apiLogout } from '../utils/api.js';
import { useNavigate } from 'react-router-dom';
import HeaderDropdown from '../components/HeaderDropdown.jsx';

function HomePage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL | ACTIVE | COMPLETED
  
  useEffect(() => {
    (async () => {
      try {
        const [ms, us] = await Promise.all([
          getMeetings().catch(() => []),
          getUsers().catch(() => []),
        ]);
        setMeetings(Array.isArray(ms) ? ms : []);
        setUsers(Array.isArray(us) ? us : []);
      } catch {}
    })();
  }, []);
  
  const filteredMeetings = useMemo(() => {
    let arr = Array.isArray(meetings) ? meetings.slice() : [];
    if (filter === 'ACTIVE') arr = arr.filter((m) => m.status === 'IN_PROGRESS');
    else if (filter === 'COMPLETED') arr = arr.filter((m) => m.status === 'COMPLETED');
    arr.sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
    return arr.slice(0, 3);
  }, [meetings, filter]);
  
  const recentUsers = useMemo(() => {
    const arr = Array.isArray(users) ? users.slice() : [];
    arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    return arr.slice(0, 4);
  }, [users]);
  
  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      const p = (n) => String(n).padStart(2, '0');
      return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
    } catch {
      return '';
    }
  };

  const navigate = useNavigate();
  const auth = useMemo(() => {
    try { const raw = localStorage.getItem('authUser'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try { if (auth?.email) await apiLogout(auth.email); } catch {}
    localStorage.removeItem('authUser');
    navigate('/login', { replace: true });
  };
  
  return (
    <>
      {/* HEADER */}
      <header>
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
                      trigger={(<><img src="/hmau-vote/img/icon_2.png" alt="" />{auth?.email || 'user'}</>)}
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
                <li><a href="/hmau-vote/console">Пульт заседания</a></li>
                <HeaderDropdown trigger="Конфигурация">
                  <li><a href="/hmau-vote/template">Шаблоны голосования</a></li>
                  <li><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
                  <li><a href="/hmau-vote/vote">Процедуры принятия решений</a></li>
                  <li><a href="/hmau-vote/screen">Экран трансляции</a></li>
                  <li><a href="/hmau-vote/linkprofile">Привязка профиля к ID</a></li>
                </HeaderDropdown>
              </ul>
            </div>
          </div>
        </div>
      </header>
      {/* MAIN */}
      <main>
        <section id="mainblock">
          <div className="container">
            <div className="wrapper">
              <h2>Добро пожаловать, <br />admin!</h2>
            </div>
          </div>
        </section>
        <section id="meetingsusers">
          <div className="container">
            <div className="wrapper">
              <div className="item">
                <h3>Заседания</h3>
                <ul className="nav">
                  <li><a href="#!" className={filter === 'ALL' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setFilter('ALL'); }}>Все</a></li>
                  <li><a href="#!" className={filter === 'ACTIVE' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setFilter('ACTIVE'); }}>Активные</a></li>
                  <li><a href="#!" className={filter === 'COMPLETED' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setFilter('COMPLETED'); }}>Завершенные</a></li>
                </ul>
                <table>
                  <tbody>
                    {filteredMeetings.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td className="date">{fmtDate(m.startTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="box__buttons">
                  <a href="/hmau-vote/meetings" className="link">Перейти к разделу</a>
                  <a href="/hmau-vote/meetings" className="btn btn-border">Все заседания</a>
                </div>
              </div>
              <div className="item item-users">
                <h3>Пользователи</h3>
                <table>
                  <tbody>
                    {recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td className="email">{u.email || ''}</td>
                        <td className={`state ${u.isOnline ? 'state-on' : 'state-off'}`}><span></span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="box__buttons">
                  <a href="/hmau-vote/users" className="link">Перейти к разделу</a>
                  <a href="/hmau-vote/users" className="btn btn-border">Все пользователи</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* FOOTER */}
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
export default HomePage;
