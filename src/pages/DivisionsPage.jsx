import React, { useState } from 'react';
import usePersistentList from '../utils/usePersistentList.js';
import EditModal from '../components/EditModal.jsx';

const LS_KEY = 'rms_divisions_v1';

function DivisionsPage() {
  const [configOpen, setConfigOpen] = useState(false);

  // стартовые данные (можешь заменить под себя)
  const initialRows = [
    { id: 1, name: 'Отдел маркетинга', usersCount: 5, admin: 'petrov@mail.ru' },
    { id: 2, name: 'Рабочая группа по внесению изменений в Устав', usersCount: 19, admin: 'petrov@mail.ru' },
    { id: 3, name: 'Рабочая группа по работе с гос. тендерами', usersCount: 24, admin: 'petrov@mail.ru' },
    { id: 4, name: 'Отдел разработки', usersCount: 20, admin: 'petrov@mail.ru' },
  ];

  // персистентный список
  const [rows, setRows] = usePersistentList(LS_KEY, initialRows);

  // модалка
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  // поля модалки (формы)
  const fields = [
    { name: 'name', label: 'Название подразделения', type: 'text', required: true },
    { name: 'admin', label: 'Администратор', type: 'text', required: false },
    { name: 'usersCount', label: 'Кол-во пользователей', type: 'number', required: false },
  ];

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, name: '', admin: '', usersCount: '' });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected(row);
    setOpen(true);
  };

  const handleSubmit = (formData /*, password */) => {
    // нормализуем число
    const normalized = {
      ...formData,
      usersCount: formData.usersCount === '' ? '' : Number(formData.usersCount),
    };

    if (isAdd) {
      const newId = (rows.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
      setRows((prev) => [{ id: newId, ...normalized }, ...prev]);
    } else if (selected) {
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...normalized } : r)));
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
                <li className="current-menu-item"><a href="/divisions">Подразделения</a></li>
                <li><a href="/meetings">Заседания</a></li>
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
                  <h1>Подразделения</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <select>
                    <option value="По дате">По дате</option>
                    <option value="По дате 1">По дате 1</option>
                    <option value="По дате 2">По дате 2</option>
                  </select>
                  <form className="search">
                    <input type="text" placeholder="Поиск" />
                    <button type="submit"></button>
                  </form>
                  <ul className="nav">
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
                      <th>Кол-во пользователей</th>
                      <th>Администратор</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.usersCount}</td>
                        <td>{row.admin}</td>
                        <td className="user__nav">
                          <button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
                          <ul className="nav__links">
                            <li>
                              <button onClick={() => handleEdit(row)}>
                                <img src="/img/icon_11.png" alt="" />Редактировать
                              </button>
                            </li>
                            <li><button><img src="/img/icon_12.png" alt="" />Заблокировать</button></li>
                            <li><button><img src="/img/icon_13.png" alt="" />В архив</button></li>
                            <li><button><img src="/img/icon_14.png" alt="" />Удалить</button></li>
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* пагинация — как в макете */}
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
          title={isAdd ? 'Добавить подразделение' : 'Редактировать подразделение'}
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

export default DivisionsPage;
