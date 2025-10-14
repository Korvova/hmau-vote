import React, { useEffect, useState } from 'react';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { getDurationTemplates, createDurationTemplate, updateDurationTemplate, deleteDurationTemplate, logout as apiLogout } from '../utils/api.js';
import EditModal from '../components/EditModal.jsx';

function DurationTemplatesPage() {
  const [configOpen, setConfigOpen] = useState(true);

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
        const list = await getDurationTemplates();
        const normalized = (Array.isArray(list) ? list : []).map(t => ({
          id: t.id,
          name: t.name,
          durationInSeconds: t.durationInSeconds
        }));
        setRows(normalized);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки шаблонов времени');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fields = [
    { name: 'name', label: 'Название', type: 'text', required: true },
    { name: 'durationInSeconds', label: 'Длительность (сек)', type: 'number', required: true },
  ];

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, name: '', durationInSeconds: 60 });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected({ id: row.id, name: row.name, durationInSeconds: row.durationInSeconds });
    setOpen(true);
  };

  const handleSubmit = async (formData /*, password */) => {
    try {
      if (isAdd) {
        const created = await createDurationTemplate({
          name: formData.name,
          durationInSeconds: parseInt(formData.durationInSeconds)
        });
        setRows(prev => [{
          id: created.id,
          name: created.name,
          durationInSeconds: created.durationInSeconds
        }, ...prev]);
      } else if (selected?.id) {
        const updated = await updateDurationTemplate(selected.id, {
          name: formData.name,
          durationInSeconds: parseInt(formData.durationInSeconds)
        });
        setRows(prev => prev.map(r => (r.id === selected.id ? {
          id: updated.id,
          name: updated.name,
          durationInSeconds: updated.durationInSeconds
        } : r)));
      }
      setOpen(false);
    } catch (e) {
      alert(e.message || 'Ошибка сохранения шаблона');
    }
  };

  const handleDelete = async (row, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!window.confirm('Удалить шаблон времени?')) return;
    try {
      await deleteDurationTemplate(row.id);
      setRows(prev => prev.filter(r => r.id !== row.id));
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} сек`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins} мин ${secs} сек` : `${mins} мин`;
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
                <li><a href="/hmau-vote/users">Пользователи</a></li>
                <li><a href="/hmau-vote/divisions">Подразделения</a></li>
                <li><a href="/hmau-vote/meetings">Заседания</a></li>
                <li><a href="/hmau-vote/console">Пульт заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/hmau-vote/template">Шаблоны голосования</a></li>
                    <li className="current-menu-item"><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
                    <li><a href="/hmau-vote/vote">Процедура подсчета голосов</a></li>
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
                  <h1>Шаблоны времени</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <ul className="nav">
                    <li><a href="#!"><img src="/hmau-vote/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/hmau-vote/img/icon_9.png" alt="" /></a></li>
                  </ul>
                </div>
                {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
              </div>

              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Длительность</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loading ? [] : rows).map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{formatDuration(row.durationInSeconds)}</td>
                        <td className="action">
                          <ul>
                            <li>
                              <a href="#!" onClick={(e) => { e.preventDefault(); handleEdit(row); }}>
                                <img src="/hmau-vote/img/icon_24.png" alt="" />
                              </a>
                            </li>
                            <li>
                              <a href="#!" onClick={(e) => handleDelete(row, e)}>
                                <img src="/hmau-vote/img/icon_26.png" alt="" />
                              </a>
                            </li>
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
          title={isAdd ? 'Добавить шаблон' : 'Редактировать шаблон'}
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

export default DurationTemplatesPage;
