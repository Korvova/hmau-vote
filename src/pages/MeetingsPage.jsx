import React, { useEffect, useState } from 'react';
import MeetingModal from '../components/MeetingModal.jsx';
import { getDivisions, getUsers, getMeetings, createMeeting, updateMeeting, deleteMeeting, archiveMeeting } from '../utils/api.js';

function MeetingsPage() {
  const [configOpen, setConfigOpen] = useState(false);

  // ��������� ������ (��������� ��� ������� �������)
    const [rows, setRows] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);

  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  // Load divisions, users and meetings
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

  // Поля для формы заседаний
  // fields removed

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
      status: 'WAITING',
    });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected({ ...row });
    setOpen(true);
  };

  const handleSubmit = async (formData /*, password */) => {
    try {
      const toIso = (d, t) => (d && t) ? new Date(d + "T" + t).toISOString() : null;
      const payload = {
        name: formData.title,
        startTime: toIso(formData.startDate, formData.startTime),
        endTime: toIso(formData.endDate, formData.endTime),
        divisionIds: formData.divisionIds || [],
        agendaItems: (formData.agenda || []).map(a => ({ number: a.number, title: a.title, speakerId: a.speakerId ?? null, link: a.link ?? null })),
      };
      if (isAdd) await createMeeting(payload); else if (selected) await updateMeeting(selected.id, payload);
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
      setOpen(false);
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
                <li className="current-menu-item"><a href="/meetings">Заседания</a></li>
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
                  <h1>Заседания</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <ul className="nav">
                    <li><a href="/meetings/archive"><img src="/img/icon_20.png" alt="" /></a></li>
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
                    {rows.map((m) => (
                      <tr key={m.id}>
                        <td>{m.title}</td>
                        <td className="date">{m.startDate} <span>{m.startTime}</span></td>
                        <td className="date">{m.endDate} <span>{m.endTime}</span></td>
                        <td>{m.divisions}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{renderStatus(m.status)}</td>
                        <td className="user__nav">
                          <button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
                          <ul className="nav__links">
                            <li>
                              <button onClick={() => handleEdit(m)}>
                                <img src="/img/icon_11.png" alt="" />Редактировать
                              </button>
                            </li>
                            <li><a href="/console/meeting/${m.id}"><img src="/img/icon_21.png" alt="" />Управлять</a></li>
                            <li><button onClick={(e) => handleArchive(m.id, e)}><img src="/img/icon_13.png" alt="" />В архив</button></li>
                            <li><button onClick={(e) => handleDelete(m.id, e)}><img src="/img/icon_14.png" alt="" />Удалить</button></li>
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

        <MeetingModal
          open={isOpen}
          data={selected}
          divisions={divisions}
          users={users}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </main>

      {/* FOOTER */}
      <footer>
        <section id="footer">
          <div className="container">
            <div className="wrapper">
              <p>&copy; rms-group.ru</p>
              <p>RMS Voting 1.01 © 2025</p>
            </div>
          </div>
        </section>
      </footer>
    </>
  );
}

export default MeetingsPage;















