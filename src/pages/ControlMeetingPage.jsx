import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMeeting, getAgendaItems, startAgendaItem as startAgendaItemRequest, apiRequest } from '../utils/api.js';

function ControlMeetingPage() {
  const { id } = useParams();
  const [configOpen, setConfigOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [m, ag] = await Promise.all([ getMeeting(id), getAgendaItems(id).catch(() => []) ]);
        setMeeting(m || null);        
        const items = Array.isArray(ag) && ag.length ? ag : (Array.isArray(m?.agendaItems) ? m.agendaItems : []);
        setAgenda(items);
      } catch {}
    })();
  }, [id]);

  const startMeeting = async () => {
    try {
      await apiRequest(`/api/meetings/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'IN_PROGRESS' }) });
      alert('Заседание запущено');
    } catch (e) {
      alert(e.message || 'Не удалось запустить заседание');
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

      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              <div className="page__top">
                <div className="top__heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h1>{meeting?.name || 'Заседание'}</h1>
                  <button className="btn btn-add" onClick={startMeeting}><span>Начать заседание</span></button>
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
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(agenda || []).map((a, idx) => (
                      <tr key={a.id || idx}>
                        <td>{a.number ?? (idx + 1)}</td>
                        <td>{a.title}</td>
                        <td>{a.speaker || a.speakerId || ''}</td>
                        <td>-</td>
                        <td>
                          <button className="btn btn-play" onClick={() => startAgendaItem(a.id)}>
                            <img src="/img/icon_play.png" alt="Запустить" />
                          </button>
                        </td>
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

export default ControlMeetingPage;



