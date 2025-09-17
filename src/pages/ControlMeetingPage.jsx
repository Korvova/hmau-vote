import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getMeeting, getAgendaItems, startAgendaItem as startAgendaItemRequest, apiRequest, getVoteResults, endVote } from '../utils/api.js';
import StartVoteModal from '../components/StartVoteModal.jsx';

function ControlMeetingPage() {
  const { id } = useParams();
  const [configOpen, setConfigOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [voteModal, setVoteModal] = useState({ open: false, agendaId: null });
  const [results, setResults] = useState([]);

  const processAgenda = (items) =>
    items.map((it) => ({
      ...it,
      inVote: Boolean(it.inVote || it.voting || it.activeIssue),
      completed: Boolean(it.completed),
    }));

  useEffect(() => {
    (async () => {
      try {
        const [m, ag] = await Promise.all([getMeeting(id), getAgendaItems(id).catch(() => [])]);
        setMeeting(m || null);
        const items = Array.isArray(ag) && ag.length ? ag : Array.isArray(m?.agendaItems) ? m.agendaItems : [];
        setAgenda(processAgenda(items));
        try {
          const rs = await getVoteResults(id).catch(() => []);
          setResults(Array.isArray(rs) ? rs : []);
        } catch {}
      } catch {}
    })();
  }, [id]);

  const startMeeting = async () => {
    if (meeting?.status === 'IN_PROGRESS') {
      try {
        await apiRequest(`/api/meetings/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'COMPLETED' }) });
        setMeeting((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
        const rs = await getVoteResults(id).catch(() => []);
        setResults(Array.isArray(rs) ? rs : []);
        alert('Заседание завершено');
      } catch (e) {
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
          it.id === agendaId ? { ...it, inVote: false, completed: true } : it
        )
      );
      const rs = await getVoteResults(id).catch(() => []);
      setResults(Array.isArray(rs) ? rs : []);
      alert('Голосование завершено');
    } catch (e) {
      alert(e.message || 'Не удалось завершить голосование');
    }
  };

  const resultsMap = useMemo(() => {
    const map = new Map();
    for (const r of results || []) {
      const key = r.agendaItemId ?? r.agendaId ?? r.itemId ?? r.id;
      map.set(key, r);
    }
    return map;
  }, [results]);

  const renderResult = (item) => {
    const r = resultsMap.get(item.id);
    if (!r) return '-';
    return `За: ${r.votesFor}, Против: ${r.votesAgainst}, Воздерж.: ${r.votesAbstain}, Не голос.: ${r.votesAbsent}`;
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
                <div className="top__heading" style={{ display: 'flex', alignItems: 'center' }}>
                  <h1>{meeting?.name || 'Заседание'}</h1>
                  <button
                    className={`btn btn-add btn-meeting${meeting?.status === 'IN_PROGRESS' ? ' btn-stop' : ''}`}
                    style={{ marginLeft: '20px' }}
                    onClick={startMeeting}
                  >
                    <span>{meeting?.status === 'IN_PROGRESS' ? 'Закончить заседание' : 'Начать заседание'}</span>
                  </button>
                  <a
                    href={`/console/meeting/${id}/screen`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-add btn-stream"
                    style={{ marginLeft: 'auto' }}
                  >
                    <span>Экран трансляции</span>
                  </a>
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
                      <tr key={a.id || idx} className={a.completed ? 'agenda-completed' : ''}>
                        <td>{a.number ?? idx + 1}</td>
                        <td>{a.title}</td>
                        <td>{a.speaker || a.speakerId || ''}</td>
                        <td>{renderResult(a)}</td>
                        <td>
                          {!a.completed && (
                            <button
                              className={`btn ${a.inVote ? 'btn-stop' : 'btn-play'}`}
                              onClick={() =>
                                a.inVote
                                  ? endAgendaVote(a.id)
                                  : setVoteModal({ open: true, agendaId: a.id })
                              }
                            >
                              <img
                                src={a.inVote ? '/img/icon_31.png' : '/img/icon_30.png'}
                                alt={a.inVote ? 'Завершить' : 'Запустить'}
                              />
                            </button>
                          )}
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
      <StartVoteModal
        open={voteModal.open}
        agendaItemId={voteModal.agendaId}
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
    </>
  );
}

export default ControlMeetingPage;






