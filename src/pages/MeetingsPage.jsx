import React, { useEffect, useState } from 'react';
import MeetingModal from '../components/MeetingModal.jsx';
import ParticipantsModal from '../components/ParticipantsModal.jsx';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { getDivisions, getUsers, getMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting, archiveMeeting, logout as apiLogout } from '../utils/api.js';

function MeetingsPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);

  // Check if user is admin
  const getAuth = () => {
    try {
      const raw = localStorage.getItem('authUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const auth = getAuth();
  const isAdmin = auth?.isAdmin;

  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantsMeetingId, setParticipantsMeetingId] = useState(null);
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
    const load = async () => {
      try {
        const [ds, us, ms] = await Promise.all([
          getDivisions().catch(() => []),
          getUsers().catch(() => []),
          getMeetings().catch(() => []),
        ]);
        setDivisions(Array.isArray(ds) ? ds : []);
        setUsers(Array.isArray(us) ? us : []);
        const pad = (n) => String(n).padStart(2, '0');
        const normalized = (Array.isArray(ms) ? ms : []).map(m => {
          const s = m.startTime ? new Date(m.startTime) : null;
          const e = m.endTime ? new Date(m.endTime) : null;
          const sd = s ? `${s.getFullYear()}-${pad(s.getMonth()+1)}-${pad(s.getDate())}` : '';
          const st = s ? `${pad(s.getHours())}:${pad(s.getMinutes())}` : '';
          const ed = e ? `${e.getFullYear()}-${pad(e.getMonth()+1)}-${pad(e.getDate())}` : '';
          const et = e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : '';
          return { id: m.id, title: m.name, startDate: sd, startTime: st, endDate: ed, endTime: et, divisions: m.divisions || '', status: m.status || 'WAITING' };
        });
        setRows(normalized);
      } catch {}
    };
    load();
  }, []);

  const renderStatus = (status) => {
    if (status === 'WAITING') return 'Ждёт запуска';
    if (status === 'IN_PROGRESS') return 'Идет';
    return 'Завершено';
  };

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({
      id: null,
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      divisions: '',
      divisionIds: [],
      agenda: [],
      status: 'WAITING',
    });
    setOpen(true);
  };

  const handleEdit = async (row) => {
    setAdd(false);
    try {
      // Загружаем полные данные заседания включая divisionIds и agenda
      const fullData = await getMeeting(row.id);
      console.log('🔍 handleEdit fullData:', fullData);
      console.log('🔍 fullData.divisions type:', typeof fullData.divisions, 'isArray:', Array.isArray(fullData.divisions));
      console.log('🔍 fullData.divisions:', fullData.divisions);

      const pad = (n) => String(n).padStart(2, '0');
      const s = fullData.startTime ? new Date(fullData.startTime) : null;
      const e = fullData.endTime ? new Date(fullData.endTime) : null;
      const sd = s ? `${s.getFullYear()}-${pad(s.getMonth()+1)}-${pad(s.getDate())}` : '';
      const st = s ? `${pad(s.getHours())}:${pad(s.getMinutes())}` : '';
      const ed = e ? `${e.getFullYear()}-${pad(e.getMonth()+1)}-${pad(e.getDate())}` : '';
      const et = e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : '';

      const divisionIds = Array.isArray(fullData.divisions)
        ? fullData.divisions.map(d => d.id)
        : [];

      console.log('🔍 Extracted divisionIds:', divisionIds);

      setSelected({
        id: fullData.id,
        title: fullData.name,
        startDate: sd,
        startTime: st,
        endDate: ed,
        endTime: et,
        divisionIds: divisionIds,
        agenda: fullData.agendaItems || [],
        status: fullData.status || 'WAITING',
        voteProcedureId: fullData.voteProcedureId || null,
      });
      setOpen(true);
    } catch (e) {
      alert(e.message || 'Ошибка загрузки данных заседания');
      console.error('❌ handleEdit error:', e);
    }
  };

  const handleSubmit = async (formData /*, password */) => {
    try {
      const toIso = (d, t) => (d && t) ? new Date(d + "T" + t).toISOString() : null;
      const payload = {
        name: formData.title,
        startTime: toIso(formData.startDate, formData.startTime),
        endTime: toIso(formData.endDate, formData.endTime),
        divisionIds: formData.divisionIds || [],
        agendaItems: (formData.agenda || []).map(a => ({ number: a.number, title: a.title, speakerId: a.speakerId ?? null, speakerName: a.speakerName ?? null, link: a.link ?? null })),
        voteProcedureId: formData.voteProcedureId ?? null,
      };

      let createdId = null;
      if (isAdd) {
        const created = await createMeeting(payload);
        createdId = created.id;
      } else if (selected) {
        await updateMeeting(selected.id, payload);
      }

      const ms = await getMeetings();
      const pad = (n) => ("0" + n).slice(-2);
      const formatDate = (d) => d ? [d.getFullYear(), pad(d.getMonth()+1), pad(d.getDate())].join("-") : "";
      const formatTime = (d) => d ? [pad(d.getHours()), pad(d.getMinutes())].join(":") : "";
      const normalized = (Array.isArray(ms) ? ms : []).map(m => {
        const s = m.startTime ? new Date(m.startTime) : null;
        const e = m.endTime ? new Date(m.endTime) : null;
        const sd = formatDate(s);
        const st = formatTime(s);
        const ed = formatDate(e);
        const et = formatTime(e);
        return { id: m.id, title: m.name, startDate: sd, startTime: st, endDate: ed, endTime: et, divisions: m.divisions || "", status: m.status || "WAITING" };
      });
      setRows(normalized);

      // Если нужно открыть ParticipantsModal после сохранения
      if (formData.openParticipantsAfterSave && createdId) {
        // Закрываем MeetingModal
        setOpen(false);
        // Открываем ParticipantsModal
        setParticipantsMeetingId(createdId);
        setShowParticipants(true);
      } else {
        setOpen(false);
      }
    } catch (e) {
      alert(e.message || "Ошибка сохранения заседания");
    }
  };

  const handleDelete = (id, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!window.confirm("Удалить заседание?")) return;
    deleteMeeting(id)
      .then(() => setRows(prev => prev.filter(r => r.id !== id)))
      .catch(err => alert(err.message || "Ошибка удаления"));
  };

  const handleArchive = (id, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!window.confirm("Переместить заседание в архив?")) return;
    archiveMeeting(id)
      .then(() => setRows(prev => prev.filter(r => r.id !== id)))
      .catch(err => alert(err.message || "Ошибка архивации"));
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
                      return <li className="current-menu-item"><a href="/hmau-vote/meetings">Заседания</a></li>;
                    }
                    // For admins, show full menu
                    return (
                      <>
                        <li><a href="/hmau-vote/users">Пользователи</a></li>
                        <li><a href="/hmau-vote/divisions">Подразделения</a></li>
                        <li className="current-menu-item"><a href="/hmau-vote/meetings">Заседания</a></li>
                        <li><a href="/hmau-vote/console">Пульт заседания</a></li>
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

      {/* MAIN */}
      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              <div className="page__top">
                <div className="top__heading">
                  <h1>Заседания</h1>
                  {isAdmin && <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>}
                </div>
                {isAdmin && (
                  <div className="top__wrapper">
                    <ul className="nav">
                      <li><a href="/hmau-vote/meetings/archive"><img src="/hmau-vote/img/icon_20.png" alt="" /></a></li>
                      <li><a href="#!"><img src="/hmau-vote/img/icon_8.png" alt="" /></a></li>
                      <li><a href="#!"><img src="/hmau-vote/img/icon_9.png" alt="" /></a></li>
                    </ul>
                  </div>
                )}
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
                    {rows.map((m) => (
                      <tr key={m.id}>
                        <td>{m.title}</td>
                        <td className="date">{m.startDate} <span>{m.startTime}</span></td>
                        <td className="date">{m.endDate} <span>{m.endTime}</span></td>
                        <td>{m.divisions}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{renderStatus(m.status)}</td>
                        <td className="user__nav">
                          <button className="user__button"><img src="/hmau-vote/img/icon_10.png" alt="" /></button>
                          <ul className="nav__links">
                            {isAdmin && (
                              <li>
                                <button onClick={() => handleEdit(m)}>
                                  <img src="/hmau-vote/img/icon_11.png" alt="" />Редактировать
                                </button>
                              </li>
                            )}
                            <li>
                              <button onClick={() => { window.location.href = `/hmau-vote/report/meeting/${m.id}`; }}>
                                <img src="/hmau-vote/img/icon_21.png" alt="" />Результат
                              </button>
                            </li>
                            {isAdmin && (
                              <>
                                <li><button onClick={(e) => handleArchive(m.id, e)}><img src="/hmau-vote/img/icon_13.png" alt="" />В архив</button></li>
                                <li><button onClick={(e) => handleDelete(m.id, e)}><img src="/hmau-vote/img/icon_14.png" alt="" />Удалить</button></li>
                              </>
                            )}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <MeetingModal
          open={isOpen}
          data={selected}
          divisions={divisions}
          users={users}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />

        <ParticipantsModal
          open={showParticipants}
          meetingId={participantsMeetingId}
          onClose={() => {
            setShowParticipants(false);
            setParticipantsMeetingId(null);
          }}
        />
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

export default MeetingsPage;















