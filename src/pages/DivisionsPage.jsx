import React, { useEffect, useState } from 'react';
import EditModal from '../components/EditModal.jsx';
import { getDivisions, createDivision, updateDivision, deleteDivision } from '../utils/api.js';

function DivisionsPage() {
  const [configOpen, setConfigOpen] = useState(false);

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await getDivisions();
        const normalized = (list || []).map(d => ({ id: d.id, name: d.name, usersCount: d.userCount || 0, admin: '' }));
        setRows(normalized);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки подразделений');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fields = [
    { name: 'name', label: 'Название подразделения', type: 'text', required: true },
  ];

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, name: '' });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected({ id: row.id, name: row.name });
    setOpen(true);
  };

  const handleSubmit = async (formData /*, password */) => {
    try {
      if (isAdd) {
        const created = await createDivision({ name: formData.name });
        setRows(prev => [{ id: created.id, name: created.name, usersCount: 0, admin: '' }, ...prev]);
      } else if (selected?.id) {
        const updated = await updateDivision(selected.id, { name: formData.name });
        setRows(prev => prev.map(r => (r.id === selected.id ? { ...r, name: updated.name } : r)));
      }
      setOpen(false);
    } catch (e) {
      alert(e.message || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Удалить подразделение?')) return;
    try {
      await deleteDivision(row.id);
      setRows(prev => prev.filter(r => r.id !== row.id));
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
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
                <li><a href="/console">Пульт заседаний</a></li>
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
                  <h1>Подразделения</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loading ? [] : rows).map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.usersCount}</td>
                        <td className="user__nav">
                          <button className="user__button"><img src="/img/icon_10.png" alt="" /></button>
                          <ul className="nav__links">
                            <li>
                              <button onClick={() => handleEdit(row)}>
                                <img src="/img/icon_11.png" alt="" />Редактировать
                              </button>
                            </li>
                            <li><button onClick={() => handleDelete(row)}><img src="/img/icon_14.png" alt="" />Удалить</button></li>
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
              <p>RMS Voting 1.2 © 2025</p>
            </div>
          </div>
        </section>
      </footer>
    </>
  );
}

export default DivisionsPage;

