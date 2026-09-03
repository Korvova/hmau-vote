import React, { useEffect, useMemo, useState } from 'react';
import socket from '../utils/socket.js';
import EditModal from '../components/EditModal.jsx';
import DisconnectModal from '../components/DisconnectModal.jsx';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { getUsers, createUser, updateUser, deleteUser, getDivisions, disconnectUser, logout as apiLogout } from '../utils/api.js';

function UsersPage() {
  const [configOpen, setConfigOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAddMode, setAddMode] = useState(false);
  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try {
      const raw = localStorage.getItem('authUser');
      const auth = raw ? JSON.parse(raw) : null;
      if (auth?.username || auth?.email) await apiLogout(auth.username, auth.email);
    } catch {}
    localStorage.removeItem('authUser');
    window.location.href = '/hmau-vote/login';
  };

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [userToDisconnect, setUserToDisconnect] = useState(null);

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
        let processedDivs = (Array.isArray(divs) ? divs : []).map((d) => {
          const rawName = d.displayName || d.name || '';
          const isInvited = Boolean(d.system) || (d.name === 'Приглашенные');
          const display = isInvited ? '👥Приглашенные' : rawName;
          return { ...d, displayName: display, system: isInvited };
        });

        // Remove duplicate system divisions - keep only the first one
        const systemDivisions = processedDivs.filter(d => d.system);
        if (systemDivisions.length > 1) {
          console.warn(`Found ${systemDivisions.length} system divisions, keeping only id=${systemDivisions[0].id}`);
          processedDivs = processedDivs.filter(d => !d.system || d.id === systemDivisions[0].id);
        }

        setDivisions(processedDivs);
        setUsers(Array.isArray(us) ? us : []);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Socket.IO listener for badge status updates
  useEffect(() => {
    // Connect socket lazily (only when needed)
    if (!socket.connected) {
      socket.connect();
    }

    const onBadgeStatusChanged = (data) => {
      setUsers((prev) => prev.map((u) =>
        u.id === data?.userId ? { ...u, isBadgeInserted: data.isBadgeInserted } : u
      ));
    };

    socket.on('badge-status-changed', onBadgeStatusChanged);

    return () => {
      socket.off('badge-status-changed', onBadgeStatusChanged);
    };
  }, []);

  const reloadUsers = async () => {
    try {
      const us = await getUsers();
      setUsers(Array.isArray(us) ? us : []);
    } catch (e) {
      // silent
    }
  };
  const divisionOptions = useMemo(
    () => (divisions || []).map(d => ({ value: d.id, label: d.displayName || d.name })),
    [divisions]
  );
  const userFields = useMemo(() => {
    const fields = [
      { name: 'name', label: 'ФИО', type: 'text', required: true },
      { name: 'username', label: 'Логин', type: 'text', required: false, placeholder: 'Опционально, если указан email' },
      { name: 'email', label: 'E-mail', type: 'text', required: false, placeholder: 'Опционально, если указан логин' },
      { name: 'phone', label: 'Телефон', type: 'text', required: false },
    ];

    // Add password field - required for add mode, optional for edit mode
    if (isAddMode) {
      fields.push({ name: 'password', label: 'Пароль', type: 'password', required: true });
    } else {
      fields.push({ name: 'password', label: 'Пароль (оставьте пустым, если не меняете)', type: 'password', required: false });
    }

    fields.push({
      name: 'divisionIds',
      label: 'Подразделения (несколько)',
      type: 'chip-multiselect',
      required: false,
      options: divisionOptions.length ? divisionOptions : [{ value: '', label: '— нет данных —' }],
    });

    return fields;
  }, [divisionOptions, isAddMode]);
  const handleEditClick = async (user) => {
    setAddMode(false);
    // Fetch fresh to avoid stale divisionIds
    try {
      const fresh = await getUsers();
      const found = (Array.isArray(fresh) ? fresh : []).find((u) => u.id === user.id);
      const ids = Array.isArray(found?.divisionIds)
        ? found.divisionIds
        : Array.isArray(user?.divisionIds)
          ? user.divisionIds
          : (user.divisionId ? [user.divisionId] : []);
      setSelectedUser({ ...user, divisionIds: ids });
    } catch {
      const ids = Array.isArray(user?.divisionIds)
        ? user.divisionIds
        : (user.divisionId ? [user.divisionId] : []);
      setSelectedUser({ ...user, divisionIds: ids });
    }
    setModalOpen(true);
  };
  const handleAddClick = (e) => {
    e.preventDefault();
    setAddMode(true);
    const firstDivisionId = divisionOptions[0]?.value ?? '';
    setSelectedUser({ id: null, name: '', username: '', email: '', phone: '', divisionIds: firstDivisionId ? [firstDivisionId] : [], isOnline: false });
    setModalOpen(true);
  };
  const handleSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        divisionIds: Array.isArray(formData.divisionIds) ? formData.divisionIds.map((v) => Number(v)).filter(Boolean) : [],
        divisionId: Array.isArray(formData.divisionIds) && formData.divisionIds.length ? Number(formData.divisionIds[0]) : null,
      };
      if (isAddMode) {
        await createUser(payload);
      } else if (selectedUser?.id) {
        // Don't send password if it's empty (user didn't change it)
        if (!payload.password) {
          delete payload.password;
        }
        await updateUser(selectedUser.id, payload);
      }
      await reloadUsers();
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
  const handleDisconnectUser = (user, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setUserToDisconnect(user);
    setShowDisconnectModal(true);
  };
  const confirmDisconnect = async () => {
    if (!userToDisconnect) return;
    try {
      await disconnectUser(userToDisconnect.id);
      setUsers(prev => prev.map(u => (u.id === userToDisconnect.id ? { ...u, isOnline: false } : u)));
      setShowDisconnectModal(false);
      setUserToDisconnect(null);
    } catch (e) {
      alert(e.message || 'Ошибка отключения пользователя');
    }
  };
  const cancelDisconnect = () => {
    setShowDisconnectModal(false);
    setUserToDisconnect(null);
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
                <li className="current-menu-item"><a href="/hmau-vote/users">Пользователи</a></li>
                <li><a href="/hmau-vote/divisions">Подразделения</a></li>
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
                  <h1>Пользователи</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAddClick}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <ul className="nav">
                    <li><a href="#!"><img src="/hmau-vote/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/hmau-vote/img/icon_9.png" alt="" /></a></li>
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
                      <th>Логин</th>
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
                        <td>
                          {user.name}
                          {user.televicExternalId && (
                            <span className="televic-badge-container">
                              <span className="televic-badge" title={`Связан с Televic делегатом ${user.televicExternalId}`}>
                                T
                              </span>
                              {user.isBadgeInserted && (
                                <span className="badge-dot" title="Карточка вставлена"></span>
                              )}
                            </span>
                          )}
                        </td>
                        <td>{user.username || '-'}</td>
                        <td>{user.email || '-'}</td>
                        <td>{user.phone}</td>
                        <td>{(() => {
                          const d = divisions.find(x => x.id === user.divisionId);
                          const fallback = user.division || d?.name || '';
                          if ((d && d.system) || /(^|\s)Приглашенные(\s|$)/i.test(fallback || '')) return '👥Приглашенные';
                          return d?.displayName || fallback;
                        })()}</td>
                        <td
                          className={`state state-${user.isOnline ? 'on' : 'off'}`}
                          title={user.isOnline ? 'Нажмите, чтобы отключить' : ''}
                          style={{ cursor: user.isOnline ? 'pointer' : 'default' }}
                          onClick={(e) => {
                            if (user.isOnline) handleDisconnectUser(user, e);
                          }}
                        >
                          <span></span>
                        </td>
                        <td className="user__nav">
                          <button type="button" className="user__button">
                            <img src="/hmau-vote/img/icon_10.png" alt="" />
                          </button>
                          <ul className="nav__links">
                            <li>
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(user); }}
                              >
                                <img src="/hmau-vote/img/icon_11.png" alt="" />
                                Редактировать
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(user.id, e)}
                              >
                                <img src="/hmau-vote/img/icon_14.png" alt="" />
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
        {showDisconnectModal && (
          <DisconnectModal
            isOpen={showDisconnectModal}
            userName={userToDisconnect?.name || ''}
            onConfirm={confirmDisconnect}
            onCancel={cancelDisconnect}
          />
        )}
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
export default UsersPage;

