import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMeetingScreenConfig, saveMeetingScreenConfig } from '../utils/api.js';

function RegistrationScreenEditor() {
  const navigate = useNavigate();
  const { id: meetingId } = useParams();
  const [config, setConfig] = useState({
    logoUrl: '',
    backgroundUrl: '',
    backgroundColor: '#1a1a2e',
    titleColor: '#ffffff',
    titleFontSize: '48px',
    subtitleColor: '#ffffff',
    subtitleFontSize: '36px',
    textColor: '#ffffff',
    textFontSize: '24px',
    lineColor: '#2196f3',
    showDate: true,
    showLogo: true,
    // Отступы
    paddingLeft: '20',
    paddingRight: '20',
    paddingTop: '40',
    paddingBottom: '40',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Load current config
    (async () => {
      try {
        if (meetingId) {
          // Load from meeting-specific config
          const screenConfig = await getMeetingScreenConfig(meetingId);
          if (screenConfig?.registration) {
            setConfig((prev) => ({ ...prev, ...screenConfig.registration }));
          }
        } else {
          // Load from global config (fallback to old API)
          const res = await fetch('/api/screen-configs/REGISTRATION');
          const data = await res.json();
          if (data.config) {
            setConfig((prev) => ({ ...prev, ...data.config }));
          }
        }
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    })();
  }, [meetingId]);

  const handleSave = async () => {
    try {
      if (meetingId) {
        // Save to meeting-specific config
        const existingConfig = await getMeetingScreenConfig(meetingId);
        const updatedConfig = {
          ...existingConfig,
          registration: config,
        };
        await saveMeetingScreenConfig(meetingId, updatedConfig);
        alert('Конфигурация сохранена для заседания!');
      } else {
        // Save to global config (fallback to old API)
        const res = await fetch('/api/screen-configs/REGISTRATION', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config }),
        });
        if (res.ok) {
          alert('Конфигурация сохранена!');
        }
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

        <h3 style={{ marginBottom: '16px' }}>Настройки экрана регистрации</h3>

        {/* Logo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Логотип</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}
          />
          {config.logoUrl && (
            <div>
              <img src={config.logoUrl} alt="Logo" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', marginBottom: '8px' }} />
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

        {/* Title Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Название (вверху)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.titleColor}
              onChange={(e) => setConfig({ ...config, titleColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.titleFontSize)}
              onChange={(e) => setConfig({ ...config, titleFontSize: e.target.value + 'px' })}
              placeholder="Размер"
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Subtitle Settings (РЕГИСТРАЦИЯ) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>"РЕГИСТРАЦИЯ" текст</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.subtitleColor}
              onChange={(e) => setConfig({ ...config, subtitleColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.subtitleFontSize)}
              onChange={(e) => setConfig({ ...config, subtitleFontSize: e.target.value + 'px' })}
              placeholder="Размер"
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Text Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Основной текст</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.textColor}
              onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.textFontSize)}
              onChange={(e) => setConfig({ ...config, textFontSize: e.target.value + 'px' })}
              placeholder="Размер"
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Line Color */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Цвет синей линии</label>
          <input
            type="color"
            value={config.lineColor}
            onChange={(e) => setConfig({ ...config, lineColor: e.target.value })}
            style={{ width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: '16px' }}>Превью</h3>
        <div
          style={{
            flex: 1,
            backgroundImage: config.backgroundUrl ? `url(${config.backgroundUrl})` : 'none',
            backgroundColor: config.backgroundUrl ? 'transparent' : config.backgroundColor,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: config.textColor,
            padding: `${config.paddingTop}px ${config.paddingRight}px ${config.paddingBottom}px ${config.paddingLeft}px`,
            borderRadius: '8px',
            position: 'relative',
          }}
        >
          {/* Logo and Date (Left 20%) */}
          <div style={{ position: 'absolute', left: `${config.paddingLeft}px`, top: `${config.paddingTop}px`, width: '18%' }}>
            {config.showLogo && config.logoUrl && (
              <img src={config.logoUrl} alt="Logo" style={{ width: '100%', marginBottom: '20px' }} />
            )}
            {config.showDate && (
              <div style={{ fontSize: '18px', color: config.textColor, textAlign: 'center' }}>
                {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                <br />
                {new Date().toLocaleTimeString('ru-RU')}
              </div>
            )}
          </div>

          {/* Main Content (Center) */}
          <div style={{ marginLeft: '22%', paddingRight: `${config.paddingRight}px` }}>
            {/* Title */}
            <div style={{ fontSize: config.titleFontSize, color: config.titleColor, textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>
              НОВОЕ ЗАСЕДАНИЕ ТЕСТ 09-10-2025
            </div>

            {/* Blue Line */}
            <div style={{ height: '4px', backgroundColor: config.lineColor, marginBottom: '40px' }} />

            {/* Registration Header */}
            <div style={{ fontSize: config.subtitleFontSize, color: config.subtitleColor, textAlign: 'center', marginBottom: '30px', fontWeight: 'bold', letterSpacing: '8px' }}>
              РЕГИСТРАЦИЯ
            </div>

            {/* Stats */}
            <div style={{ fontSize: config.textFontSize, color: config.textColor, marginBottom: '30px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ display: 'inline-block', width: '300px' }}>ПО СПИСКУ:</span>
                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>38</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ display: 'inline-block', width: '300px' }}>ПРИСУТСТВУЮТ:</span>
                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>0</span>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ display: 'inline-block', width: '300px' }}>ОТСУТСТВУЮТ:</span>
              </div>
            </div>

            {/* Names List */}
            <div style={{ fontSize: '18px', color: config.textColor, lineHeight: '1.6' }}>
              ГЛОТОВА А.И., ОСАДЧУК А.М., СЕРДЮК М.И., ЖУКОВ В.М., ВАКАНТНЫЙ МАНДАТ, АЙПИН Е.Д., СЕМЕНОВ В.Н., ПЫТЯЛЕВ С.В., ЗАБОЛОТНЕВ Н.Н., ДУБОВ В.В.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationScreenEditor;
