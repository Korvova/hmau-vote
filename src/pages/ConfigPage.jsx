import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePersistentList from '../utils/usePersistentList.js';
import EditModal from '../components/EditModal.jsx';

const LS_KEY = 'rms_config_meetings_v1';

function ConfigPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const navigate = useNavigate();

  // стартовые строки (как в твоей версии), теперь — через персистентный список
  const initialRows = [
    {
      id: 1,
      name: 'Внесение изменений в Устав',
      startTime: '2025-07-17 11:00',
      endTime: '2025-07-17 15:00',
      divisions:
        'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров',
      status: 'IN_PROGRESS', // WAITING | IN_PROGRESS | DONE
      isArchived: false,
    },
    {
      id: 2,
      name: 'Внесение изменений в Устав',
      startTime: '2025-07-17 11:00',
      endTime: '2025-07-17 15:00',
      divisions:
        'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров',
      status: 'WAITING',
      isArchived: false,
    },
    {
      id: 3,
      name: 'Внесение изменений в Устав',
      startTime: '2025-07-17 11:00',
      endTime: '2025-07-17 15:00',
      divisions:
        'Рабочая группа по внесению изменений в Устав, совет директоров, отдел кадров',
      status: 'DONE',
      isArchived: false,
    },
  ];

  const [meetings, setMeetings] = usePersistentList(LS_KEY, initialRows);

  // модалка (добавление/редактирование)
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  // поля формы модалки — соответствуют колонкам таблицы (структуру таблицы НЕ меняем)
  const fields = [
    { name: 'name', label: 'Название заседания', type: 'text', required: true },
    {
      name: 'startTime',
      label: 'Начало (YYYY-MM-DD HH:mm)',
      type: 'text',
      required: true,
    },
    {
      name: 'endTime',
      label: 'Конец (YYYY-MM-DD HH:mm)',
      type: 'text',
      required: true,
    },
    { name: 'divisions', label: 'Подразделения', type: 'textarea', required: false },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      required: true,
      options: [
        { label: 'Ждет запуска', value: 'WAITING' },
        { label: 'Идет', value: 'IN_PROGRESS' },
        { label: 'Завершено', value: 'DONE' },
      ],
    },
  ];

  const renderStatus = (status) => {
    if (status === 'WAITING') return 'Ждет запуска';
    if (status === 'IN_PROGRESS') return 'Идет';
    return 'Завершено';
  };

  const showPdf = (status) => status !== 'WAITING';

  const handleMeetingClick = (meetingId) => {
    navigate(`/admin/control/meeting/${meetingId}`);
  };

  const handleArchiveMeeting = (meetingId) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, isArchived: true } : m))
    );
  };

  // Добавление
  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({
      id: null,
      name: '',
      startTime: '',
      endTime: '',
      divisions: '',
      status: 'WAITING',
      isArchived: false,
    });
    setOpen(true);
  };

  // Редактирование
  const handleEdit = (row) => {
    setAdd(false);
    setSelected(row);
    setOpen(true);
  };

  // Применить изменения (и для add, и для edit)
  const handleSubmit = (formData /*, password */) => {
    if (isAdd) {
      const newId = (meetings.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
      const newRow = { id: newId, isArchived: false, ...formData };
      setMeetings((prev) => [newRow, ...prev]);
    } else if (selected) {
      setMeetings((prev) =>
        prev.map((m) => (m.id === selected.id ? { ...m, ...formData } : m))
      );
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
                  <a href="/">
                    <img src="/img/logo.png" alt="" />
                  </a>
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">
                  <a href="#!" className="support">
                    <img src="/img/icon_1.png" alt="" />
                    Поддержка
                  </a>
                  <ul>
                    <li className="menu-children">
                      <a href="#!">
                        <img src="/img/icon_2.png" alt="" />
                        admin@admin.ru
                      </a>
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
                <li>
                  <a href="/users">Пользователи</a>
                </li>
                <li>
                  <a href="/divisions">Подразделения</a>
                </li>
                <li>
                  <a href="/meetings">Заседания</a>
                </li>
                <li className="current-menu-item">
                  <a href="/console">Пульт Заседания</a>
                </li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      setConfigOpen(!configOpen);
                    }}
                  >
                    Конфигурация
                  </a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li>
                      <a href="/template">Шаблон голосования</a>
                    </li>
                    <li>
                      <a href="/vote">Процедура подсчета голосов</a>
                    </li>
                    <li>
                      <a href="/screen">Экран трансляции</a>
                    </li>
                    <li>
                      <a href="/linkprofile">Связать профиль с ID</a>
                    </li>
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
                  <h1>Управление заседаниями</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}>
                    <span>Добавить</span>
                  </a>
                </div>
                <div className="top__wrapper">
                  <select>
                    <option value="По дате начала">По дате начала</option>
                    <option value="По дате начала 1">По дате начала 1</option>
                    <option value="По дате начала 2">По дате начала 2</option>
                  </select>
                  <form className="search">
                    <input type="text" placeholder="Поиск" />
                    <button type="submit"></button>
                  </form>
                  <ul className="nav">
                    <li>
                      <a href="#!">
                        <img src="/img/icon_20.png" alt="" />
                      </a>
                    </li>
                    <li>
                      <a href="#!">
                        <img src="/img/icon_8.png" alt="" />
                      </a>
                    </li>
                    <li>
                      <a href="#!">
                        <img src="/img/icon_9.png" alt="" />
                      </a>
                    </li>
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
                      <th>Подразделения</th>
                      <th>Статус</th>
                      <th>Результат</th>
                      <th>Действие</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings
                      .filter((m) => !m.isArchived)
                      .map((m) => {
                        const [sd, st] = (m.startTime || '').split(' ');
                        const [ed, et] = (m.endTime || '').split(' ');
                        return (
                          <tr key={m.id}>
                            <td>{m.name}</td>
                            <td className="date">
                              {sd} <span>{st}</span>
                            </td>
                            <td className="date">
                              {ed} <span>{et}</span>
                            </td>
                            <td>{m.divisions}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{renderStatus(m.status)}</td>
                            <td>{showPdf(m.status) ? <a href="#!"><img src="/img/icon_23.png" alt="" /></a> : ''}</td>
                            <td>
                              <a
                                href="#!"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleMeetingClick(m.id);
                                }}
                              >
                                Управлять
                              </a>
                            </td>
                            <td className="user__nav">
                              <button className="user__button">
                                <img src="/img/icon_10.png" alt="" />
                              </button>
                              <ul className="nav__links">
                                <li>
                                  <button onClick={() => handleEdit(m)}>
                                    <img src="/img/icon_11.png" alt="" />
                                    Редактировать
                                  </button>
                                </li>
                                <li>
                                  <button onClick={() => handleMeetingClick(m.id)}>
                                    <img src="/img/icon_21.png" alt="" />
                                    Результаты
                                  </button>
                                </li>
                                <li>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveMeeting(m.id);
                                    }}
                                  >
                                    <img src="/img/icon_13.png" alt="" />
                                    В архив
                                  </button>
                                </li>
                                <li>
                                  <button>
                                    <img src="/img/icon_14.png" alt="" />
                                    Удалить
                                  </button>
                                </li>
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
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

        {/* МОДАЛКА добавления/редактирования */}
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

export default ConfigPage;

