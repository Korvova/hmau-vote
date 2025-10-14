import React, { useEffect, useState } from 'react';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { logout as apiLogout, apiRequest } from '../utils/api.js';

function ContactsPage() {
  const [configOpen, setConfigOpen] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      try {
        const contact = await apiRequest('/api/contacts');
        setName(contact.name || '');
        setPhone(contact.phone || '');
      } catch (e) {
        console.error('Ошибка загрузки контакта:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('ФИО и телефон обязательны');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, phone }),
      });
      alert('Контакт сохранён');
    } catch (e) {
      alert(e.message || 'Ошибка сохранения контакта');
    } finally {
      setSaving(false);
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
                    <li><a href="/hmau-vote/duration-templates">Шаблоны времени</a></li>
                    <li><a href="/hmau-vote/vote">Процедура подсчёта голосов</a></li>
                    <li><a href="/hmau-vote/screen">Экран трансляции</a></li>
                    <li><a href="/hmau-vote/linkprofile">Связать профиль с ID</a></li>
                    <li className="current-menu-item"><a href="/hmau-vote/contacts">Контакты</a></li>
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
                  <h1>Контакты для связи</h1>
                </div>
              </div>

              <div className="page__body">
                <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
                  Эти контактные данные будут показаны пользователям при возникновении проблем с авторизацией
                </p>

                {loading ? (
                  <p>Загрузка...</p>
                ) : (
                  <form onSubmit={handleSave} className="form">
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label htmlFor="name" className="form-label">
                        ФИО контактного лица <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Введите ФИО"
                        required
                        style={{ maxWidth: '500px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '32px' }}>
                      <label htmlFor="phone" className="form-label">
                        Номер телефона <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (900) 123-45-67"
                        required
                        style={{ maxWidth: '500px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-add"
                    >
                      <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default ContactsPage;
