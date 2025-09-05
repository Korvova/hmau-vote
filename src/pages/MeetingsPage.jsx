import React, { useState } from 'react';
import usePersistentList from '../utils/usePersistentList.js';
import EditModal from '../components/EditModal.jsx';

const LS_KEY = 'rms_meetings_v1';

function MeetingsPage() {
  const [configOpen, setConfigOpen] = useState(false);

  // стартовые данные (выравнены под текущую верстку)
  const initialRows = [
    {
      id: 1,
      title: 'Внесение изменений в Устав',
      startDate: '2025-07-17',
      startTime: '11:00',
      endDate: '2025-07-17',
      endTime: '15:00',
      divisions: 'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров',
      status: 'WAITING', // WAITING | IN_PROGRESS | DONE
    },
    {
      id: 2,
      title: 'Внесение изменений в Устав',
      startDate: '2025-07-17',
      startTime: '11:00',
      endDate: '2025-07-17',
      endTime: '15:00',
      divisions: 'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров',
      status: 'IN_PROGRESS',
    },
    {
      id: 3,
      title: 'Внесение изменений в Устав',
      startDate: '2025-07-17',
      startTime: '11:00',
      endDate: '2025-07-17',
      endTime: '15:00',
      divisions: 'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров',
      status: 'DONE',
    },
  ];

  const [rows, setRows] = usePersistentList(LS_KEY, initialRows);

  // модалка
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  // поля формы для заседаний
  const fields = [
    { name: 'title', label: 'Название заседания', type: 'text', required: true },
    { name: 'startDate', label: 'Дата начала', type: 'date', required: true },
    { name: 'startTime', label: 'Время начала', type: 'time', required: true },
    { name: 'endDate', label: 'Дата окончания', type: 'date', required: true },
    { name: 'endTime', label: 'Время окончания', type: 'time', required: true },
    { name: 'divisions', label: 'Подразделения', type: 'textarea', required: false },
    { name: 'status', label: 'Статус', type: 'select', required: true, options: [
      { label: 'Ждет запуска', value: 'WAITING' },
      { label: 'Идет', value: 'IN_PROGRESS' },
      { label: 'Завершено', value: 'DONE' },
    ] },
  ];

  const renderStatus = (status) => {
    if (status === 'WAITING') return 'Ждет запуска';
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
    setSelected(row);
    setOpen(true);
  };

  const handleSubmit = (formData /*, password */) => {
    if (isAdd) {
      const newId = (rows.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
      setRows((prev) => [{ id: newId, ...formData }, ...prev]);
    } else if (selected) {
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...formData } : r)));
    }
    setOpen(false);
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
                <li><a href="/console">Пульт Заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/template">Шаблон голосования</a></li>
                    <li><a href="/vote">Процедура подсчета голосов</a></li>
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
                    <li><a href="#!"><img src="/img/icon_20.png" alt="" /></a></li>
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
                            <li><button><img src="/img/icon_21.png" alt="" />Результат</button></li>
                            <li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
                            <li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
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

        <EditModal
          open={isOpen}
          data={selected}
          fields={fields}
          title={isAdd ? 'Добавить заседание' : 'Редактировать заседание'}
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
              <p>RMS Voting 1.01 – 2025</p>
            </div>
          </div>
        </section>
      </footer>
    </>
  );
}

export default MeetingsPage;
