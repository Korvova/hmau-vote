import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SCREEN_TITLES = {
  registration: 'Экран регистрации',
  agenda: 'Экран активной повестки',
  voting: 'Экран голосования',
  final: 'Финальный экран',
};

function ScreenEditorPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const title = SCREEN_TITLES[type] || 'Редактор экрана';

  return (
    <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/hmau-vote/screen')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Назад
        </button>
        <h1 style={{ margin: 0 }}>{title}</h1>
      </div>

      <div
        style={{
          padding: '48px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px dashed #ccc',
        }}
      >
        <h2 style={{ color: '#666', marginBottom: '16px' }}>Редактор в разработке</h2>
        <p style={{ color: '#999', fontSize: '16px' }}>
          Здесь будет визуальный редактор для настройки {title.toLowerCase()}
        </p>
        <p style={{ color: '#999', fontSize: '14px', marginTop: '24px' }}>
          Вы сможете настраивать:
          <br />
          • Цвета и шрифты
          <br />
          • Расположение элементов
          <br />
          • Отображаемую информацию
          <br />• И многое другое
        </p>
      </div>
    </main>
  );
}

export default ScreenEditorPage;
