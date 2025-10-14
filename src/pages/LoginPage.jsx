import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api.js';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contact, setContact] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    setContact(null);
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res?.success && res?.user) {
        localStorage.setItem('authUser', JSON.stringify(res.user));
        if (res.user.isAdmin) navigate('/', { replace: true });
        else navigate('/user', { replace: true });
      } else {
        setError('Неверный ответ сервера');
      }
    } catch (err) {
      const errorData = err.data || {};
      setError(err.message || 'Ошибка входа');
      if (errorData.contact) {
        setContact(errorData.contact);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
      <form onSubmit={handleSubmit} style={{ width: 360, background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, textAlign: 'center' }}>Вход</h2>
        {error ? (
          <div style={{ color: '#c62828', marginBottom: 12, padding: '12px', backgroundColor: '#ffebee', borderRadius: 6 }}>
            {error}
            {contact && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ef9a9a' }}>
                <strong>Свяжитесь с:</strong>
                <div style={{ marginTop: 8 }}>
                  <div>{contact.name}</div>
                  <div>Тел: {contact.phone}</div>
                </div>
              </div>
            )}
          </div>
        ) : null}
        <label style={{ display: 'block', marginBottom: 8 }}>Логин или Email</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Введите логин или email" style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcdcdc', borderRadius: 6, marginBottom: 12 }} />
        <label style={{ display: 'block', marginBottom: 8 }}>Пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcdcdc', borderRadius: 6, marginBottom: 16 }} />
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}

export default LoginPage;
