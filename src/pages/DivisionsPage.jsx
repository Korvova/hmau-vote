import React, { useEffect, useState } from 'react';
import EditModal from '../components/EditModal.jsx';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { getDivisions, createDivision, updateDivision, deleteDivision, logout as apiLogout } from '../utils/api.js';

function DivisionsPage() {
  const [configOpen, setConfigOpen] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);
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
      setLoading(true);
      setError('');
      try {
        let list = await getDivisions();
        let normalized = (list || []).map((d) => {
          const rawName = d.displayName || d.name || '';
          const isInvited = Boolean(d.system) || (d.name === 'Приглашенные');
          const display = isInvited ? '👥Приглашенные' : rawName;
          return { id: d.id, name: display, usersCount: d.userCount || 0, system: isInvited };
        });
        // Remove duplicates: keep only the first system division
        const systemDivisions = normalized.filter(d => d.system);
        if (systemDivisions.length > 1) {
          // Keep the first one (oldest), mark others for deletion
          console.warn(`Found ${systemDivisions.length} system divisions, keeping only id=${systemDivisions[0].id}`);
          normalized = normalized.filter(d => !d.system || d.id === systemDivisions[0].id);
        }
        // Fallback: if system group missing entirely, create and refetch
        const hasInvited = normalized.some(d => d.system);
        if (!hasInvited) {
          try { await createDivision({ name: 'Приглашенные' }); } catch {}
          list = await getDivisions();
          normalized = (list || []).map((d) => {
            const rawName = d.displayName || d.name || '';
            const isInvited = Boolean(d.system) || (d.name === 'Приглашенные');
            const display = isInvited ? '👥Приглашенные' : rawName;
            return { id: d.id, name: display, usersCount: d.userCount || 0, system: isInvited };
          });
        }
        // System first, then by name
        normalized.sort((a, b) => (a.system === b.system ? String(a.name || '').localeCompare(String(b.name || ''), 'ru') : (a.system ? -1 : 1)));
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
                  <a href="/hmau-vote/"><img src="/hmau-vote/img/header/header-left.jpg" alt="" /></a>
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
                <li><a href="/hmau-vote/users">Пользователи</a></li>
                <li className="current-menu-item"><a href="/hmau-vote/divisions">Подразделения</a></li>
                <li><a href="/hmau-vote/meetings">Заседания</a></li>
                <li><a href="/hmau-vote/console">Пульт заседаний</a></li>
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
                    <li><a href="#!"><img src="/hmau-vote/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/hmau-vote/img/icon_9.png" alt="" /></a></li>
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
                          {row.system ? (
                            <span style={{ color: '#777', fontSize: 12 }}>Системная</span>
                          ) : (
                            <>
                              <button className="user__button" title="Действия"><img src="/hmau-vote/img/icon_10.png" alt="" /></button>
                              <ul className="nav__links">
                                <li>
                                  <button onClick={() => handleEdit(row)}>
                                    <img src="/hmau-vote/img/icon_11.png" alt="" />Редактировать
                                  </button>
                                </li>
                                <li>
                                  <button onClick={() => handleDelete(row)}>
                                    <img src="/hmau-vote/img/icon_14.png" alt="" />Удалить
                                  </button>
                                </li>
                              </ul>
                            </>
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
