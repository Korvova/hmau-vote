import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function FinalScreenEditor() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    logoUrl: '',
    backgroundUrl: '',
    backgroundColor: '#1a1a2e',

    // Top text
    topText: 'ХАНТЫ-МАНСИЙСКИЙ АВТОНОМНЫЙ ОКРУГ - ЮГРА',
    topTextColor: '#ffffff',
    topTextFontSize: '36px',

    // Bottom text
    bottomText: 'МЕРОПРИЯТИЕ ЗАВЕРШЕНО',
    bottomTextColor: '#ffffff',
    bottomTextFontSize: '28px',

    // Отступы
    paddingLeft: '30',
    paddingRight: '30',
    paddingTop: '30',
    paddingBottom: '30',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load current config
    (async () => {
      try {
        const res = await fetch('/api/screen-configs/FINAL');
        const data = await res.json();
        if (data.config) {
          setConfig((prev) => ({ ...prev, ...data.config }));
        }
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/screen-configs/FINAL', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        alert('Конфигурация сохранена!');
      }
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await fetch('/api/screen-uploads/logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setConfig((prev) => ({ ...prev, logoUrl: data.url }));
      }
    } catch (err) {
      alert('Ошибка загрузки: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('background', file);
    try {
      const res = await fetch('/api/screen-uploads/background', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setConfig((prev) => ({ ...prev, backgroundUrl: data.url }));
      }
    } catch (err) {
      alert('Ошибка загрузки: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Left Panel - Settings */}
      <div style={{ width: '350px', backgroundColor: '#fff', padding: '20px', overflowY: 'auto', borderRight: '1px solid #ddd' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/screen')}
            style={{ padding: '8px 16px', backgroundColor: '#757575', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Назад
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
          >
            Сохранить
          </button>
        </div>

        <h3 style={{ marginBottom: '16px' }}>Настройки финального экрана</h3>

        {/* Logo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Логотип (центр, большой)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}
          />
          {config.logoUrl && (
            <div>
              <img src={config.logoUrl} alt="Logo" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', marginBottom: '8px' }} />
              <button
                onClick={() => setConfig({ ...config, logoUrl: '' })}
                style={{ padding: '6px 12px', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
              >
                Удалить логотип
              </button>
            </div>
          )}
        </div>

        {/* Background Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Фон</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}
          />
          {config.backgroundUrl && (
            <div>
              <img src={config.backgroundUrl} alt="Background" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '80px', objectFit: 'cover', marginBottom: '8px' }} />
              <button
                onClick={() => setConfig({ ...config, backgroundUrl: '' })}
                style={{ padding: '6px 12px', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
              >
                Удалить фон
              </button>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Цвет фона (если нет изображения)</label>
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
            style={{ width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {/* Padding Settings */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>Отступы (px)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Слева:</label>
              <input
                type="number"
                value={config.paddingLeft}
                onChange={(e) => setConfig({ ...config, paddingLeft: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
                max="200"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Справа:</label>
              <input
                type="number"
                value={config.paddingRight}
                onChange={(e) => setConfig({ ...config, paddingRight: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
                max="200"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Сверху:</label>
              <input
                type="number"
                value={config.paddingTop}
                onChange={(e) => setConfig({ ...config, paddingTop: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
                max="200"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Снизу:</label>
              <input
                type="number"
                value={config.paddingBottom}
                onChange={(e) => setConfig({ ...config, paddingBottom: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="0"
                max="200"
              />
            </div>
          </div>
        </div>

        {/* Top Text Settings */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff8dc', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>Верхний текст (над лого)</label>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Текст:</label>
            <textarea
              value={config.topText}
              onChange={(e) => setConfig({ ...config, topText: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }}
              placeholder="Введите текст"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Цвет:</label>
              <input
                type="color"
                value={config.topTextColor}
                onChange={(e) => setConfig({ ...config, topTextColor: e.target.value })}
                style={{ width: '100%', height: '35px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Размер:</label>
              <input
                type="number"
                value={parseInt(config.topTextFontSize)}
                onChange={(e) => setConfig({ ...config, topTextFontSize: e.target.value + 'px' })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="12"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Bottom Text Settings */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fff0', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>Нижний текст (под лого)</label>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Текст:</label>
            <textarea
              value={config.bottomText}
              onChange={(e) => setConfig({ ...config, bottomText: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }}
              placeholder="Введите текст"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Цвет:</label>
              <input
                type="color"
                value={config.bottomTextColor}
                onChange={(e) => setConfig({ ...config, bottomTextColor: e.target.value })}
                style={{ width: '100%', height: '35px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Размер:</label>
              <input
                type="number"
                value={parseInt(config.bottomTextFontSize)}
                onChange={(e) => setConfig({ ...config, bottomTextFontSize: e.target.value + 'px' })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="12"
                max="100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>Превью</h3>
        <div
          style={{
            width: '100%',
            minHeight: '600px',
            backgroundColor: config.backgroundColor,
            backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: `${config.paddingTop}px ${config.paddingRight}px ${config.paddingBottom}px ${config.paddingLeft}px`,
            position: 'relative',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top Text */}
          {config.topText && (
            <div style={{
              fontSize: config.topTextFontSize,
              color: config.topTextColor,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '40px',
              maxWidth: '80%'
            }}>
              {config.topText}
            </div>
          )}

          {/* Logo (Center, Large) */}
          {config.logoUrl && (
            <div style={{ marginBottom: '40px', maxWidth: '500px', width: '40%' }}>
              <img src={config.logoUrl} alt="Logo" style={{ width: '100%', height: 'auto' }} />
            </div>
          )}

          {/* Bottom Text */}
          {config.bottomText && (
            <div style={{
              fontSize: config.bottomTextFontSize,
              color: config.bottomTextColor,
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '80%'
            }}>
              {config.bottomText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinalScreenEditor;
