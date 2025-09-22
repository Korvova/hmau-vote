import React, { useState } from 'react';
import usePersistentList from '../utils/usePersistentList.js';
import EditModal from '../components/EditModal.jsx';

const LS_KEY = 'rms_link_profile_v1';

function LinkProfilePage() {
  const [configOpen, setConfigOpen] = useState(true);

  const initialRows = [
    { id: 1, fullName: 'Иванов Н. А.', externalId: '124779' },
    { id: 2, fullName: 'Иванов Н. Б.', externalId: '124779' },
    { id: 3, fullName: 'Иванов Н. В.', externalId: '124779' },
  ];

  const [rows, setRows] = usePersistentList(LS_KEY, initialRows);
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  const fields = [
    { name: 'fullName', label: 'ФИО', type: 'text', required: true },
    { name: 'externalId', label: 'ID', type: 'text', required: true },
  ];

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, fullName: '', externalId: '' });
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

  const nameOptions = ['Иванов Н. А.', 'Иванов Н. Б.', 'Иванов Н. В.'];

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
                <li><a href="/console">Пульт Заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/template">Шаблон голосования</a></li>
                    <li><a href="/vote">Процедура подсчета голосов</a></li>
                    <li><a href="/screen">Экран трансляции</a></li>
                    <li className="current-menu-item"><a href="/linkprofile">Связать профиль с ID</a></li>
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
                  <h1>Связать профиль с ID</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
              </div>

              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>ID</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="select-name">
                          <select
                            value={row.fullName}
                            onChange={(e) => {
                              const v = e.target.value;
                              setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, fullName: v } : r)));
                            }}
                          >
                            {nameOptions.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="input-id">
                          <input
                            type="text"
                            value={row.externalId}
                            onChange={(e) => {
                              const v = e.target.value;
                              setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, externalId: v } : r)));
                            }}
                          />
                        </td>
                        <td className="action action-small">
                          <ul>
                            <li><a href="#!" onClick={(e) => { e.preventDefault(); handleEdit(row); }}><img src="/img/icon_29.png" alt="" /></a></li>
                            <li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
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

        <EditModal
          open={isOpen}
          data={selected}
          fields={fields}
          title={isAdd ? 'Добавить связь профиля' : 'Редактировать связь профиля'}
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
              <p>RMS Voting 1.2 © 2025</p>
            </div>
          </div>
        </section>
      </footer>
    </>
  );
}

export default LinkProfilePage;

