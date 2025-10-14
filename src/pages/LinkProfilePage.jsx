import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { logout as apiLogout } from '../utils/api.js';

function LinkProfilePage() {
  const [configOpen, setConfigOpen] = useState(true);
  const [deviceLinks, setDeviceLinks] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState({});

  // Televic integration state
  const [connectors, setConnectors] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('1');
  const [delegates, setDelegates] = useState([]);
  const [linkRows, setLinkRows] = useState([{ userId: '', externalId: '' }]);

  const navigate = useNavigate();
  const auth = useMemo(() => {
    try {
      const raw = localStorage.getItem('authUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    try {
      if (auth?.email) await apiLogout(auth.email);
    } catch {}
    localStorage.removeItem('authUser');
    navigate('/hmau-vote/login', { replace: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceLinksResp, usersResp, televicLinksResp] = await Promise.all([
          axios.get('/api/device-links'),
          axios.get('/api/users'),
          axios.get('/api/televic/links'),
        ]);
        setDeviceLinks(deviceLinksResp.data);
        const televicMap = new Map((televicLinksResp.data || []).map((u) => [u.id, u.televicExternalId]));
        const mergedUsers = (usersResp.data || []).map((u) => ({
          ...u,
          televicExternalId: u.televicExternalId ?? televicMap.get(u.id) ?? null,
        }));
        setUsers(mergedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    loadConnectors();
  }, []);

  const refreshTelevicLinks = async () => {
    try {
      const r = await axios.get('/api/televic/links');
      setUsers((prev) =>
        prev.map((u) => {
          const found = r.data.find((x) => x.id === u.id);
          return found ? { ...u, televicExternalId: found.televicExternalId } : u;
        })
      );
    } catch (e) {
      // ignore
    }
  };

  const quickUnlink = async (userId) => {
    try {
      await axios.delete(`/api/televic/link/${userId}`);
      await refreshTelevicLinks();
      setDelegates([...delegates]);
    } catch (e) {
      alert('Ошибка отвязки: ' + (e.response?.data?.error || e.message));
    }
  };

  const addNewLink = () => {
    setDeviceLinks([...deviceLinks, { id: null, userId: '', userName: '', deviceId: '' }]);
  };

  const clearMessage = (index) => {
    setTimeout(() => {
      setMessages((prev) => ({ ...prev, [index]: null }));
    }, 3000);
  };

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...deviceLinks];
    updatedLinks[index][field] = value;
    setDeviceLinks(updatedLinks);
  };

  const saveLink = async (index) => {
    const link = deviceLinks[index];
    if (!link.userId || !link.deviceId) {
      setMessages((prev) => ({ ...prev, [index]: { type: 'error', text: 'Выберите пользователя и введите ID устройства' } }));
      clearMessage(index);
      return;
    }

    try {
      if (link.id) {
        await axios.put(`/api/device-links/${link.id}`, {
          userId: link.userId,
          deviceId: link.deviceId,
        });
        setMessages((prev) => ({ ...prev, [index]: { type: 'success', text: 'Связь обновлена' } }));
      } else {
        const response = await axios.post('/api/device-links', {
          userId: link.userId,
          deviceId: link.deviceId,
        });
        const updatedLinks = [...deviceLinks];
        updatedLinks[index] = {
          id: response.data.id,
          userId: response.data.userId,
          userName: users.find((user) => user.id === parseInt(link.userId))?.name || '',
          deviceId: response.data.deviceId,
        };
        setDeviceLinks(updatedLinks);
        setMessages((prev) => ({ ...prev, [index]: { type: 'success', text: 'Связь создана' } }));
      }
      const response = await axios.get('/api/device-links');
      setDeviceLinks(response.data);
      clearMessage(index);
    } catch (error) {
      console.error('Error saving device link:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при сохранении связи';
      setMessages((prev) => ({ ...prev, [index]: { type: 'error', text: errorMessage } }));
      clearMessage(index);
    }
  };

  const deleteLink = async (index) => {
    const link = deviceLinks[index];
    if (link.id) {
      try {
        await axios.delete(`/api/device-links/${link.id}`);
        setMessages((prev) => ({ ...prev, [index]: { type: 'success', text: 'Связь удалена' } }));
      } catch (error) {
        console.error('Error deleting device link:', error);
        setMessages((prev) => ({ ...prev, [index]: { type: 'error', text: 'Ошибка при удалении связи' } }));
        clearMessage(index);
        return;
      }
    }
    const updatedLinks = deviceLinks.filter((_, i) => i !== index);
    setDeviceLinks(updatedLinks);
    clearMessage(index);
  };

  const loadConnectors = async () => {
    try {
      const r = await axios.get('/api/connectors');
      const items = r.data.items || [];
      setConnectors(items);
      if (items.length > 0) {
        const first = items[0];
        if (!selectedTopic) setSelectedTopic(first.topic || 'default-topic');
        if (!selectedRoomId) setSelectedRoomId(String(first.roomId || '1'));
      }
    } catch (e) {
      console.error('Error loading connectors', e.message);
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
                  <a href="/hmau-vote/"><img src="/hmau-vote/img/logo.png" alt="" /></a>
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">

                  <ul>
                    <HeaderDropdown trigger={(<><img src="/hmau-vote/img/icon_2.png" alt="" />{auth?.email || 'user'}</>)}>
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
                <li><a href="/hmau-vote/console">Пульт Заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/hmau-vote/template">Шаблон голосования</a></li>
                    <li><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
                    <li><a href="/hmau-vote/vote">Процедура подсчета голосов</a></li>
                    <li><a href="/hmau-vote/screen">Экран трансляции</a></li>
                    <li className="current-menu-item"><a href="/hmau-vote/linkprofile">Связать профиль с ID</a></li>
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
                  <h1>Связать профиль с ID</h1>
                </div>
              </div>

              {/* Televic Section */}
              <div className="page__televic">
                <h2>Televic: подключение и связывание делегатов</h2>
                <div className="televic__controls">
                  <button className="btn btn-primary" onClick={loadConnectors}>Подключить Televic</button>
                  <span className="badge">Коннекторов: {connectors.length}</span>
                  <div className="televic__field">
                    <label>Топик:</label>
                    <input type="text" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} />
                  </div>
                  <div className="televic__field">
                    <label>Room ID:</label>
                    <input type="text" value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} style={{ width: '100px' }} />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        const r = await axios.get(`/api/coconagenda/GetAllDelegates`, {
                          params: { topic: selectedTopic, roomId: selectedRoomId },
                        });
                        setDelegates(r.data || []);
                        await refreshTelevicLinks();
                      } catch (e) {
                        console.error('Error loading delegates', e.message);
                        alert('Ошибка загрузки делегатов: ' + e.message);
                      }
                    }}
                    disabled={connectors.length === 0}
                  >
                    Загрузить делегатов
                  </button>
                  {connectors.length === 0 && <span style={{ fontSize: '12px', color: '#999' }}>Сначала подключите Televic</span>}
                </div>

                <div className="televic__panels">
                  <div className="televic__panel">
                    <h3>Делегаты Televic ({delegates.length})</h3>
                    <div className="televic__list">
                      <ul>
                        {delegates.map((d, i) => (
                          <li key={i}>
                            {d.name || d.displayName || d.fullName || d.id}{' '}
                            <span style={{ color: '#999', fontSize: '12px' }}>({String(d.id || d.externalId || '')})</span>
                          </li>
                        ))}
                        {delegates.length === 0 && <li style={{ color: '#999' }}>Нет данных (загрузите делегатов)</li>}
                      </ul>
                    </div>

                    <h3 style={{ marginTop: '20px' }}>Текущие связи</h3>
                    <div className="televic__list">
                      <ul>
                        {users.filter((u) => !!u.televicExternalId).map((u) => (
                          <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                              {u.name} <span style={{ color: '#999', fontSize: '12px' }}>(Televic: {u.televicExternalId})</span>
                            </span>
                            <button className="btn btn-small btn-danger" onClick={() => quickUnlink(u.id)}>
                              Отвязать
                            </button>
                          </li>
                        ))}
                        {users.filter((u) => !!u.televicExternalId).length === 0 && <li style={{ color: '#999' }}>Связи отсутствуют</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="televic__panel">
                    <h3>Связать пользователь ↔ делегат</h3>
                    <div className="page__table">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '40%' }}>Пользователь</th>
                            <th style={{ width: '40%' }}>Televic делегат</th>
                            <th style={{ width: '20%' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {linkRows.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <select
                                  value={row.userId}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    const copy = [...linkRows];
                                    copy[idx].userId = v;
                                    setLinkRows(copy);
                                  }}
                                >
                                  <option value="">Выберите пользователя</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name} {u.televicExternalId ? `(Televic: ${u.televicExternalId})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  value={row.externalId}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    const copy = [...linkRows];
                                    copy[idx].externalId = v;
                                    setLinkRows(copy);
                                  }}
                                >
                                  <option value="">Выберите делегата</option>
                                  {delegates
                                    .filter(
                                      (d) =>
                                        !new Set(users.filter((u) => !!u.televicExternalId).map((u) => String(u.televicExternalId))).has(
                                          String(d.id || d.externalId || '')
                                        )
                                    )
                                    .map((d, i) => (
                                      <option key={i} value={String(d.id || d.externalId || '')}>
                                        {d.name || d.displayName || d.fullName || d.id}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td className="action">
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-small"
                                    disabled={!row.userId || !row.externalId}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        const payload = { userId: Number(row.userId), externalId: row.externalId };
                                        await axios.post('/api/televic/link', payload);
                                        await refreshTelevicLinks();
                                        alert('Связано');
                                      } catch (err) {
                                        alert('Ошибка: ' + (err.response?.data?.error || err.message));
                                      }
                                    }}
                                  >
                                    Связать
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-small btn-danger"
                                    disabled={!row.userId}
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        if (!row.userId) return;
                                        await axios.delete(`/api/televic/link/${row.userId}`);
                                        await refreshTelevicLinks();
                                        alert('Отвязано');
                                      } catch (err) {
                                        alert('Ошибка: ' + (err.response?.data?.error || err.message));
                                      }
                                    }}
                                  >
                                    Отвязать
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="btn btn-add"
                      onClick={() => setLinkRows([...linkRows, { userId: '', externalId: '' }])}
                    >
                      <span>+ Добавить строку</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Device Links Section */}
              <div className="page__table" style={{ marginTop: '40px' }}>
                <h2>Связи устройств</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Пользователь</th>
                      <th>ID устройства</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceLinks.map((link, index) => (
                      <tr key={index}>
                        <td>
                          <select value={link.userId || ''} onChange={(e) => handleLinkChange(index, 'userId', e.target.value)}>
                            <option value="">Выберите пользователя</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input type="text" value={link.deviceId || ''} onChange={(e) => handleLinkChange(index, 'deviceId', e.target.value)} placeholder="Введите ID устройства" />
                        </td>
                        <td className="action action-small">
                          <ul>
                            <li>
                              <a href="#!" onClick={(e) => { e.preventDefault(); saveLink(index); }}>
                                <img src="/hmau-vote/img/icon_30.png" alt="Сохранить" title="Сохранить" />
                              </a>
                            </li>
                            <li>
                              <a href="#!" onClick={(e) => { e.preventDefault(); deleteLink(index); }}>
                                <img src="/hmau-vote/img/icon_26.png" alt="Удалить" title="Удалить" />
                              </a>
                            </li>
                          </ul>
                          {messages[index] && (
                            <span style={{ color: messages[index].type === 'error' ? 'red' : 'green', marginLeft: '10px', fontSize: '12px' }}>
                              {messages[index].text}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-add" onClick={addNewLink}>
                  <span>+ Добавить связь</span>
                </button>
              </div>
            </div>
          </div>
        </section>
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
