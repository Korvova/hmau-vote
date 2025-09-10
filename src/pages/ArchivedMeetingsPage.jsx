import React, { useEffect, useState } from 'react';
import { getArchivedMeetings, deleteMeeting } from '../utils/api.js';

function ArchivedMeetingsPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const ms = await getArchivedMeetings();
        const pad = (n) => String(n).padStart(2, '0');
        const normalized = (Array.isArray(ms) ? ms : []).map(m => {
          const s = m.startTime ? new Date(m.startTime) : null;
          const e = m.endTime ? new Date(m.endTime) : null;
          const sd = s ? `${s.getFullYear()}-${pad(s.getMonth()+1)}-${pad(s.getDate())}` : '';
          const st = s ? `${pad(s.getHours())}:${pad(s.getMinutes())}` : '';
          const ed = e ? `${e.getFullYear()}-${pad(e.getMonth()+1)}-${pad(e.getDate())}` : '';
          const et = e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : '';
          return { id: m.id, title: m.name, startDate: sd, startTime: st, endDate: ed, endTime: et, divisions: m.divisions || '', status: m.status || 'COMPLETED' };
        });
        setRows(normalized);
      } catch {}
    };
    load();
  }, []);

  const renderStatus = (status) => {
    if (status === 'WAITING') return 'Ждёт запуска';
    if (status === 'IN_PROGRESS') return 'Идёт';
    return 'Завершено';
  };

  const handleDelete = async (id, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!window.confirm('Удалить заседание?')) return;
    try {
      await deleteMeeting(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  return (
    <>
      {/* HEADER (копия стиля, как на других страницах) */}
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
                <li><a href="/console">Пульт заседания</a></li>
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
                  <h1>Архив заседаний</h1>
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(m => (
                      <tr key={m.id}>
                        <td>{m.title}</td>
                        <td className="date">{m.startDate} <span>{m.startTime}</span></td>
                        <td className="date">{m.endDate} <span>{m.endTime}</span></td>
                        <td>{m.divisions}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{renderStatus(m.status)}</td>
                        <td className="action action-small">
                          <ul>
                            <li>
                              <a href="#!" onClick={(e) => handleDelete(m.id, e)}>
                                <img src="/img/icon_14.png" alt="" />
                              </a>
                            </li>
                          </ul>
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

export default ArchivedMeetingsPage;
