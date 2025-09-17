import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api.js';
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res?.success && res?.user) {
        localStorage.setItem('authUser', JSON.stringify(res.user));
        // Роутинг по роли
        if (res.user.isAdmin) navigate('/', { replace: true });
        else navigate('/user', { replace: true });
      } else {
        setError('Неверный ответ сервера');
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
      <form onSubmit={handleSubmit} style={{ width: 360, background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, textAlign: 'center' }}>Вход</h2>
        {error ? (<div style={{ color: '#c62828', marginBottom: 12 }}>{error}</div>) : null}
        <label style={{ display: 'block', marginBottom: 8 }}>E‑mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcdcdc', borderRadius: 6, marginBottom: 12 }} />
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
