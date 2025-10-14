import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderDropdown from '../components/HeaderDropdown.jsx';
import { logout as apiLogout } from '../utils/api.js';

const SCREEN_TYPES = [
  {
    type: 'REGISTRATION',
    title: 'Экран регистрации',
    description: 'Отображается до начала заседания',
    color: '#1976d2',
  },
  {
    type: 'AGENDA',
    title: 'Экран активной повестки',
    description: 'Показывает текущий вопрос повестки',
    color: '#388e3c',
  },
  {
    type: 'VOTING',
    title: 'Экран голосования',
    description: 'Отображается во время голосования',
    color: '#f57c00',
  },
  {
    type: 'FINAL',
    title: 'Финальный экран',
    description: 'Показывает итоги голосования',
    color: '#7b1fa2',
  },
];

function ScreenConfigPage() {
  const [configOpen, setConfigOpen] = useState(true);
  const [configs, setConfigs] = useState([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/screen-configs');
        const data = await res.json();
        setConfigs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load screen configs:', err);
      }
    })();
  }, []);

  const getConfigByType = (type) => {
    return configs.find((c) => c.type === type) || {};
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
                  <a href="/hmau-vote/">
                    <img src="/hmau-vote/img/logo.png" alt="" />
                  </a>
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">
                  <ul>
                    <HeaderDropdown
                      trigger={(
                        <>
                          <img src="/hmau-vote/img/icon_2.png" alt="" />
                          {(() => {
                            try {
                              const a = JSON.parse(localStorage.getItem('authUser') || 'null');
                              return a?.name || a?.email || 'admin@admin.ru';
                            } catch {
                              return 'admin@admin.ru';
                            }
                          })()}
                        </>
                      )}
                    >
                      <li>
                        <button type="button" className="logout-button" onClick={handleLogout}>
                          Выйти
                        </button>
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
                <li>
                  <a href="/hmau-vote/users">Пользователи</a>
                </li>
                <li>
                  <a href="/hmau-vote/divisions">Подразделения</a>
                </li>
                <li>
                  <a href="/hmau-vote/meetings">Заседания</a>
                </li>
                <li>
                  <a href="/hmau-vote/console">Пульт Заседания</a>
                </li>
                <li className={`menu-children current-menu-item`}>
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
                      <a href="/hmau-vote/template">Шаблон голосования</a>
                    </li>
                    <li>
                      <a href="/hmau-vote/duration-templates">Шаблоны времени</a>
                    </li>
                    <li>
                      <a href="/hmau-vote/vote">Процедура подсчета голосов</a>
                    </li>
                    <li className="current-menu-item">
                      <a href="/hmau-vote/screen">Экран трансляции</a>
                    </li>
                    <li>
                      <a href="/hmau-vote/linkprofile">Связать профиль с ID</a>
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
                  <h1>Экран трансляции</h1>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '24px',
                  marginTop: '32px',
                }}
              >
                {SCREEN_TYPES.map((screen) => {
                  const config = getConfigByType(screen.type);
                  return (
                    <div
                      key={screen.type}
                      style={{
                        border: `3px solid ${screen.color}`,
                        borderRadius: '8px',
                        padding: '24px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        position: 'relative',
                      }}
                      onClick={() => navigate(`/screen/edit/${screen.type.toLowerCase()}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '6px',
                          backgroundColor: screen.color,
                          borderTopLeftRadius: '4px',
                          borderTopRightRadius: '4px',
                        }}
                      />
                      <h2 style={{ margin: '16px 0 8px', color: screen.color, fontSize: '24px' }}>
                        {screen.title}
                      </h2>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                        {screen.description}
                      </p>
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          marginBottom: '16px',
                          minHeight: '150px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: '14px',
                        }}
                      >
                        {config.config ? (
                          <div style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ fontSize: '12px', marginBottom: '8px' }}>Превью:</div>
                            <div
                              style={{
                                backgroundColor: config.config.backgroundColor || '#ffffff',
                                padding: '12px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                              }}
                            >
                              <div
                                style={{
                                  color: config.config.headerColor || '#000',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                }}
                              >
                                {screen.title}
                              </div>
                            </div>
                          </div>
                        ) : (
                          'Загрузка...'
                        )}
                      </div>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: screen.color,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/screen/edit/${screen.type.toLowerCase()}`);
                        }}
                      >
                        Редактировать
                      </button>
                    </div>
                  );
                })}
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

export default ScreenConfigPage;
