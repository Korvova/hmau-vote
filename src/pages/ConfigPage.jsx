import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeetings } from '../utils/api.js';
import HeaderDropdown from '../components/HeaderDropdown.jsx';

function ConfigPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const ms = await getMeetings();
        const pad = (n) => String(n).padStart(2, '0');
        const normalized = (Array.isArray(ms) ? ms : []).map((m) => {
          const s = m.startTime ? new Date(m.startTime) : null;
          const e = m.endTime ? new Date(m.endTime) : null;
          const sd = s ? `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}` : '';
          const st = s ? `${pad(s.getHours())}:${pad(s.getMinutes())}` : '';
          const ed = e ? `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}` : '';
          const et = e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : '';
          return {
            id: m.id,
            name: m.name,
            startDate: sd,
            startTime: st,
            endDate: ed,
            endTime: et,
            divisions: m.divisions || '',
            status: m.status || 'WAITING',
          };
        });
        setRows(normalized);
      } catch {}
    };
    load();
  }, []);

  const renderStatus = (status) => {
    if (status === 'WAITING') return 'Ждет запуска';
    if (status === 'IN_PROGRESS') return 'Идет';
    return 'Завершено';
  };

  const handleManage = (id, e) => {
    e?.preventDefault?.();
    navigate(`/console/meeting/${id}`);
  };

  return (
    <>
      {/* HEADER */}
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
                      <a href="#!"><img src="/img/icon_2.png" alt="" />admin@admin.ru</a>
                    </li>
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
                <li><a href="/users">Пользователи</a></li>
                <li><a href="/divisions">Подразделения</a></li>
                <li><a href="/meetings">Заседания</a></li>
                <li className="current-menu-item"><a href="/console">Пульт заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/template">Шаблоны голосования</a></li>
                    <li><a href="/vote">Процедура подсчёта голосов</a></li>
                    <li><a href="/screen">Экран трансляции</a></li>
                    <li><a href="/linkprofile">Связать профиль с ID</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              <div className="page__top">
                <div className="top__heading">
                  <h1>Пульт заседания</h1>
                </div>
                <div className="top__wrapper">
                  <ul className="nav">
                    <li><a href="/meetings"><img src="/img/icon_20.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/img/icon_9.png" alt="" /></a></li>
                  </ul>
                </div>
              </div>

              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Начало</th>
                      <th>Конец</th>
                      <th>Подразделение</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows || []).map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td className="date">{m.startDate} <span>{m.startTime}</span></td>
                        <td className="date">{m.endDate} <span>{m.endTime}</span></td>
                        <td>{m.divisions}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{renderStatus(m.status)}</td>
                        <td>
                          <a href="#!" onClick={(e) => handleManage(m.id, e)}>Управлять</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="wp-pagenavi">
                  <a href="#" className="previouspostslink"></a>
                  <a href="#">1</a>
                  <span>2</span>
                  <a href="#">3</a>
                  <a href="#">4</a>
                  <a href="#" className="nextpostslink"></a>
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

export default ConfigPage;

