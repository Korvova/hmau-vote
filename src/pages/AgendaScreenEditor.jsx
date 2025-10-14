import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AgendaScreenEditor() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    logoUrl: '',
    logoSize: '50%', // 50% от оригинального размера регистрации
    backgroundUrl: '',
    backgroundColor: '#1a1a2e',
    meetingTitleColor: '#ffffff',
    meetingTitleFontSize: '32px',
    dateColor: '#ffffff',
    dateFontSize: '20px',
    currentQuestionColor: '#ffffff',
    currentQuestionFontSize: '36px',
    speakersLabelColor: '#ffffff',
    speakersLabelFontSize: '24px',
    speakersNamesColor: '#ffffff',
    speakersNamesFontSize: '20px',
    questionNumberColor: '#ffffff',
    questionNumberFontSize: '24px',
    speakerItemColor: '#ffffff',
    speakerItemFontSize: '22px',
    activeSpeakerBgColor: '#2196f3',
    activeSpeechBgColor: '#ff9800', // Цвет подложки для активного выступающего
    speechNumberColor: '#ffffff',
    speechNumberFontSize: '24px',
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
        const res = await fetch('/api/screen-configs/AGENDA');
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
      const res = await fetch('/api/screen-configs/AGENDA', {
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

        <h3 style={{ marginBottom: '16px' }}>Настройки экрана повестки</h3>

        {/* Logo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Логотип (слева вверху, 50% размера)</label>
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
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Название заседания</label>
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

        {/* Date Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Дата (справа вверху)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.dateColor}
              onChange={(e) => setConfig({ ...config, dateColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.dateFontSize)}
              onChange={(e) => setConfig({ ...config, dateFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Current Question Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Текущий вопрос повестки (по центру)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.currentQuestionColor}
              onChange={(e) => setConfig({ ...config, currentQuestionColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.currentQuestionFontSize)}
              onChange={(e) => setConfig({ ...config, currentQuestionFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Speakers Label Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>"Докладывают:" текст</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.speakersLabelColor}
              onChange={(e) => setConfig({ ...config, speakersLabelColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.speakersLabelFontSize)}
              onChange={(e) => setConfig({ ...config, speakersLabelFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Speakers Names Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ФИО докладчиков</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.speakersNamesColor}
              onChange={(e) => setConfig({ ...config, speakersNamesColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.speakersNamesFontSize)}
              onChange={(e) => setConfig({ ...config, speakersNamesFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Question Number Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>"Вопрос (N)" текст</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.questionNumberColor}
              onChange={(e) => setConfig({ ...config, questionNumberColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.questionNumberFontSize)}
              onChange={(e) => setConfig({ ...config, questionNumberFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Speaker Item Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ФИО выступающих (список)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.speakerItemColor}
              onChange={(e) => setConfig({ ...config, speakerItemColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.speakerItemFontSize)}
              onChange={(e) => setConfig({ ...config, speakerItemFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Active Speaker Background (for Question) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Цвет подложки активного в "Вопрос"</label>
          <input
            type="color"
            value={config.activeSpeakerBgColor}
            onChange={(e) => setConfig({ ...config, activeSpeakerBgColor: e.target.value })}
            style={{ width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {/* Speech Number Settings */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>"Выступление (N)" текст</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="color"
              value={config.speechNumberColor}
              onChange={(e) => setConfig({ ...config, speechNumberColor: e.target.value })}
              style={{ width: '50px', height: '35px' }}
              title="Цвет"
            />
            <input
              type="number"
              value={parseInt(config.speechNumberFontSize)}
              onChange={(e) => setConfig({ ...config, speechNumberFontSize: e.target.value + 'px' })}
              style={{ width: '80px', padding: '4px' }}
              placeholder="Размер"
              title="Размер шрифта"
            />
          </div>
        </div>

        {/* Active Speech Background */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Цвет подложки активного в "Выступление"</label>
          <input
            type="color"
            value={config.activeSpeechBgColor}
            onChange={(e) => setConfig({ ...config, activeSpeechBgColor: e.target.value })}
            style={{ width: '100%', height: '40px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
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
          {/* Logo (Left Top, 50% smaller) */}
          {config.logoUrl && (
            <div style={{ position: 'absolute', left: `${config.paddingLeft}px`, top: `${config.paddingTop}px`, width: '9%' }}>
              <img src={config.logoUrl} alt="Logo" style={{ width: '100%' }} />
            </div>
          )}

          {/* Meeting Title (Center Top) */}
          <div style={{ position: 'absolute', left: '15%', right: '15%', top: `${config.paddingTop}px`, textAlign: 'center' }}>
            <div style={{ fontSize: config.meetingTitleFontSize, color: config.meetingTitleColor, fontWeight: 'bold' }}>
              НОВОЕ ЗАСЕДАНИЕ
            </div>
          </div>

          {/* Date (Right Top) */}
          <div style={{ position: 'absolute', right: `${config.paddingRight}px`, top: `${config.paddingTop}px`, textAlign: 'right' }}>
            <div style={{ fontSize: config.dateFontSize, color: config.dateColor }}>
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
              <br />
              {new Date().toLocaleTimeString('ru-RU')}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ marginTop: '180px' }}>
            {/* Current Question (Left aligned) */}
            <div style={{ fontSize: config.currentQuestionFontSize, color: config.currentQuestionColor, textAlign: 'left', marginBottom: '30px', fontWeight: 'bold' }}>
              1 НОВИЙО ПРОЕКТЕ ЗАКОНА ХАНТЫ-МАНСИЙСКОГО АВТОНОМНОГО ОКРУГА - ЮГРЫ "О ВНЕСЕНИИ ИЗМЕНЕНИЙ В ЗАКОН ХАНТЫ-МАНСИЙСКОГО АВТОНОМНОГО ОКРУГА - ЮГРЫ "О ДОПОЛНИТЕЛЬНЫХ МЕРАХ ПОДДЕРЖКИ СЕМЕЙ, ИМЕЮЩИХ ДЕТЕЙ, В ХАНТЫ-МАНСИЙСКОМ АВТОНОМНОМ ОКРУГЕ - ЮГРЕ" (ПЕРВОЕ ЧТЕНИЕ).
            </div>

            {/* Speakers Label and Names */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: config.speakersLabelFontSize, color: config.speakersLabelColor, marginBottom: '10px' }}>
                ДОКЛАДЫВАЮТ РУКОВОДИТЕЛИ ДЕПУТАТСКИХ ФРАКЦИЙ:
              </div>
              <div style={{ fontSize: config.speakersNamesFontSize, color: config.speakersNamesColor, lineHeight: '1.6' }}>
                СЕРДЮК МИХАИЛ ИВАНОВИЧ; САВИНЦЕВ АЛЕКСЕЙ ВЛАДИМИРОВИЧ; ЗАПАДНОВА НАТАЛЬЯ ЛЕОНИДОВНА; СЫСУН ВИКТОР БОГДАНОВИЧ; ЗИНОВЬЕВ ВЛАДИМИР НИКОЛАЕВИЧ.
              </div>
            </div>

            {/* Question Number and Speech Number - Same Line */}
            <div style={{ display: 'flex', gap: '40px', marginBottom: '15px' }}>
              {/* Question Section */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: config.questionNumberFontSize, color: config.questionNumberColor, marginBottom: '10px' }}>
                  ВОПРОС <span style={{
                    display: 'inline-block',
                    width: '35px',
                    height: '35px',
                    lineHeight: '35px',
                    textAlign: 'center',
                    backgroundColor: '#555',
                    borderRadius: '4px',
                    marginLeft: '8px'
                  }}>2</span>
                </div>
                {/* Question Speaker List */}
                <div>
                  <div style={{
                    fontSize: config.speakerItemFontSize,
                    color: config.speakerItemColor,
                    padding: '10px 15px',
                    backgroundColor: config.activeSpeakerBgColor,
                    marginBottom: '8px',
                    borderRadius: '4px'
                  }}>
                    1. ЗАПАДНОВА Н.Л.
                  </div>
                  <div style={{
                    fontSize: config.speakerItemFontSize,
                    color: config.speakerItemColor,
                    padding: '10px 15px',
                    marginBottom: '8px'
                  }}>
                    2. ТАШЛАНОВ Н.В.
                  </div>
                </div>
              </div>

              {/* Speech Section */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: config.speechNumberFontSize, color: config.speechNumberColor, marginBottom: '10px' }}>
                  ВЫСТУПЛЕНИЕ <span style={{
                    display: 'inline-block',
                    width: '35px',
                    height: '35px',
                    lineHeight: '35px',
                    textAlign: 'center',
                    backgroundColor: '#555',
                    borderRadius: '4px',
                    marginLeft: '8px'
                  }}>0</span>
                </div>
                {/* Speech Speaker List */}
                <div>
                  <div style={{
                    fontSize: config.speakerItemFontSize,
                    color: config.speakerItemColor,
                    padding: '10px 15px',
                    backgroundColor: config.activeSpeechBgColor,
                    marginBottom: '8px',
                    borderRadius: '4px'
                  }}>
                    1. ИВАНОВ П.С.
                  </div>
                  <div style={{
                    fontSize: config.speakerItemFontSize,
                    color: config.speakerItemColor,
                    padding: '10px 15px',
                    marginBottom: '8px'
                  }}>
                    2. ПЕТРОВ С.И.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgendaScreenEditor;
