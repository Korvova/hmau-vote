import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VotingScreenEditor() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    logoUrl: '',
    backgroundUrl: '',
    backgroundColor: '#1a1a2e',
    meetingTitleColor: '#ffffff',
    meetingTitleFontSize: '28px',

    // Progress bar
    progressBarBgColor: '#ffffff',
    progressBarFillColor: '#2196f3',
    progressBarHeight: '8',

    // Timer
    timerColor: '#ffffff',
    timerFontSize: '36px',

    // Result title (РЕШЕНИЕ НЕ ПРИНЯТО)
    resultTitleColor: '#ffffff',
    resultTitleFontSize: '48px',

    // Vote labels (ЗА, ПРОТИВ, etc)
    voteLabelColor: '#ffffff',
    voteLabelFontSize: '32px',

    // Vote numbers
    voteNumberColor: '#ffffff',
    voteNumberFontSize: '32px',

    // Quorum
    quorumColor: '#ffffff',
    quorumFontSize: '28px',

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
        const res = await fetch('/api/screen-configs/VOTING');
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
      const res = await fetch('/api/screen-configs/VOTING', {
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

        <h3 style={{ marginBottom: '16px' }}>Настройки экрана голосования</h3>

        {/* Logo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Логотип (слева вверху)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}
          />
          {config.logoUrl && (
            <div>
              <img src={config.logoUrl} alt="Logo" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '60px', objectFit: 'contain', marginBottom: '8px' }} />
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

        {/* Meeting Title Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Название мероприятия</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.meetingTitleColor}
              onChange={(e) => setConfig({ ...config, meetingTitleColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.meetingTitleFontSize)}
              onChange={(e) => setConfig({ ...config, meetingTitleFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Progress Bar Settings */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>Прогресс-бар</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Цвет фона:</label>
              <input
                type="color"
                value={config.progressBarBgColor}
                onChange={(e) => setConfig({ ...config, progressBarBgColor: e.target.value })}
                style={{ width: '100%', height: '35px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Цвет заполнения:</label>
              <input
                type="color"
                value={config.progressBarFillColor}
                onChange={(e) => setConfig({ ...config, progressBarFillColor: e.target.value })}
                style={{ width: '100%', height: '35px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Высота (px):</label>
              <input
                type="number"
                value={config.progressBarHeight}
                onChange={(e) => setConfig({ ...config, progressBarHeight: e.target.value })}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                min="4"
                max="30"
              />
            </div>
          </div>
        </div>

        {/* Timer Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Таймер обратного отсчета</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.timerColor}
              onChange={(e) => setConfig({ ...config, timerColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.timerFontSize)}
              onChange={(e) => setConfig({ ...config, timerFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Result Title Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Результат голосования (заголовок)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.resultTitleColor}
              onChange={(e) => setConfig({ ...config, resultTitleColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.resultTitleFontSize)}
              onChange={(e) => setConfig({ ...config, resultTitleFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Vote Label Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Метки голосов (ЗА, ПРОТИВ...)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.voteLabelColor}
              onChange={(e) => setConfig({ ...config, voteLabelColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.voteLabelFontSize)}
              onChange={(e) => setConfig({ ...config, voteLabelFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Vote Number Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Числа голосов</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.voteNumberColor}
              onChange={(e) => setConfig({ ...config, voteNumberColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.voteNumberFontSize)}
              onChange={(e) => setConfig({ ...config, voteNumberFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Quorum Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Кворум</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.quorumColor}
              onChange={(e) => setConfig({ ...config, quorumColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.quorumFontSize)}
              onChange={(e) => setConfig({ ...config, quorumFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
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
          }}
        >
          {/* Logo (Left Top) */}
          {config.logoUrl && (
            <div style={{ position: 'absolute', left: `${config.paddingLeft}px`, top: `${config.paddingTop}px`, width: '9%' }}>
              <img src={config.logoUrl} alt="Logo" style={{ width: '100%' }} />
              <div style={{ textAlign: 'center', fontSize: '18px', color: config.meetingTitleColor, marginTop: '10px', fontWeight: 'bold' }}>
                1.1
              </div>
            </div>
          )}

          {/* Meeting Title (Top Center) */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: config.meetingTitleFontSize, color: config.meetingTitleColor, fontWeight: 'bold' }}>
              НОВОЕ ЗАСЕДАНИЕ
            </div>
          </div>

          {/* Progress Bar and Timer */}
          <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                width: '100%',
                height: `${config.progressBarHeight}px`,
                backgroundColor: config.progressBarBgColor,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '60%', // 60% заполнения
                  height: '100%',
                  backgroundColor: config.progressBarFillColor,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            <div style={{
              fontSize: config.timerFontSize,
              color: config.timerColor,
              fontWeight: 'bold',
              minWidth: '120px',
              textAlign: 'right'
            }}>
              00:06
            </div>
          </div>

          {/* Main Content - Centered */}
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            {/* Result Title */}
            <div style={{
              fontSize: config.resultTitleFontSize,
              color: config.resultTitleColor,
              fontWeight: 'bold',
              marginBottom: '40px',
              letterSpacing: '4px'
            }}>
              РЕШЕНИЕ НЕ ПРИНЯТО
            </div>

            {/* Vote Results */}
            <div style={{ textAlign: 'right', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: config.voteLabelFontSize, color: config.voteLabelColor }}>ЗА</span>
                <span style={{ fontSize: config.voteNumberFontSize, color: config.voteNumberColor, fontWeight: 'bold' }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: config.voteLabelFontSize, color: config.voteLabelColor }}>ПРОТИВ</span>
                <span style={{ fontSize: config.voteNumberFontSize, color: config.voteNumberColor, fontWeight: 'bold' }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: config.voteLabelFontSize, color: config.voteLabelColor }}>ВОЗДЕРЖАЛОСЬ</span>
                <span style={{ fontSize: config.voteNumberFontSize, color: config.voteNumberColor, fontWeight: 'bold' }}>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: config.voteLabelFontSize, color: config.voteLabelColor }}>НЕ ГОЛОСОВАЛИ</span>
                <span style={{ fontSize: config.voteNumberFontSize, color: config.voteNumberColor, fontWeight: 'bold' }}>38</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                <span style={{ fontSize: config.quorumFontSize, color: config.quorumColor, fontWeight: 'bold' }}>КВОРУМ</span>
                <span style={{ fontSize: config.quorumFontSize, color: config.quorumColor, fontWeight: 'bold' }}>ЕСТЬ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VotingScreenEditor;
