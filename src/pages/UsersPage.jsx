import React, { useEffect, useMemo, useState } from 'react';
import EditModal from '../components/EditModal.jsx';
import { getUsers, createUser, updateUser, deleteUser, getDivisions } from '../utils/api.js';
function UsersPage() {
  const [configOpen, setConfigOpen] = useState(false);
  // UI state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAddMode, setAddMode] = useState(false);
  // Data from API
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [divs, us] = await Promise.all([
          getDivisions(),
          getUsers(),
        ]);
        setDivisions(Array.isArray(divs) ? divs : []);
        setUsers(Array.isArray(us) ? us : []);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  const divisionOptions = useMemo(
    () => (divisions || []).map(d => ({ value: d.id, label: d.name })),
    [divisions]
  );
  const userFields = [
    { name: 'name', label: 'ФИО', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'text', required: true },
    { name: 'phone', label: 'Телефон', type: 'text', required: false },
    {
      name: 'divisionId',
      label: 'Подразделение',
      type: 'select',
      required: false,
      options: divisionOptions.length ? divisionOptions : [{ value: '', label: '— нет данных —' }],
    },
  ];
  const handleEditClick = (user) => {
    setAddMode(false);
    setSelectedUser({ ...user, divisionId: user.divisionId ?? '' });
    setModalOpen(true);
  };
  const handleAddClick = (e) => {
    e.preventDefault();
    setAddMode(true);
    const firstDivisionId = divisionOptions[0]?.value ?? '';
    setSelectedUser({ id: null, name: '', email: '', phone: '', divisionId: firstDivisionId, isOnline: false });
    setModalOpen(true);
  };
  const handleSubmit = async (formData, password) => {
    try {
      const payload = {
        ...formData,
        divisionId: formData.divisionId === '' || formData.divisionId == null ? null : Number(formData.divisionId),
      };
      if (password) payload.password = password;
      if (isAddMode) {
        const created = await createUser(payload);
        setUsers(prev => [created, ...prev]);
      } else if (selectedUser?.id) {
        const updated = await updateUser(selectedUser.id, payload);
        setUsers(prev => prev.map(u => (u.id === selectedUser.id ? updated : u)));
      }
      setModalOpen(false);
    } catch (e) {
      alert(e.message || 'Ошибка сохранения');
    }
  };
  const handleDelete = async (id, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
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
                <li className="current-menu-item"><a href="/users">Пользователи</a></li>
                <li><a href="/divisions">Подразделения</a></li>
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
                  <h1>Пользователи</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAddClick}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <ul className="nav">
                    <li><a href="#!"><img src="/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/img/icon_9.png" alt="" /></a></li>
                  </ul>
                </div>
                {error && (
                  <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
                )}
              </div>
              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>E-mail</th>
                      <th>Телефон</th>
                      <th>Подразделение</th>
                      <th className="th-state">Статус</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loading ? [] : users).map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.division ?? (divisions.find(d => d.id === user.divisionId)?.name || '')}</td>
                        <td className={`state state-${user.isOnline ? 'on' : 'off'}`}>
                          <span></span>
                        </td>
                        <td className="user__nav">
                          <button type="button" className="user__button">
                            <img src="/img/icon_10.png" alt="" />
                          </button>
                          <ul className="nav__links">
                            <li>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(user); }}
                              >
                                <img src="/img/icon_11.png" alt="" />
                                Редактировать
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(user.id, e)}
                              >
                                <img src="/img/icon_14.png" alt="" />
                                Удалить
                              </button>
                            </li>
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
        {/* MODAL */}
        <EditModal
          open={isModalOpen}
          data={selectedUser}
          fields={userFields}
          title={isAddMode ? 'Добавить пользователя' : 'Редактировать пользователя'}
          onClose={() => setModalOpen(false)}
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
export default UsersPage;


