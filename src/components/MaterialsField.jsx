import React, { useRef, useState } from 'react';
import { isUploadedMaterial, materialsFileName, materialsHref, uploadMaterialsFile } from '../utils/materials.js';

/**
 * Поле «Материалы» вопроса повестки.
 * Сверху — ссылка (на внешний ресурс или файл), снизу — кнопка «Загрузить файл»:
 * загруженный файл кладётся на сервер, а в ссылку подставляется его адрес /uploads/agenda/...
 * value  — строка link
 * onChange(nextValue)
 */
export default function MaterialsField({ value, onChange, inputStyle = {}, placeholder = 'Ссылка на материалы' }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [fileLabel, setFileLabel] = useState('');
  const uploaded = isUploadedMaterial(value);

  const pick = () => fileRef.current && fileRef.current.click();

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadMaterialsFile(file);
      setFileLabel(file.name);
      onChange(url);
    } catch (err) {
      alert(err.message || 'Не удалось загрузить файл');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFileLabel('');
    onChange('');
  };

  const btn = {
    padding: '6px 12px',
    border: '1px solid #cfd6e0',
    borderRadius: 6,
    background: '#f3f6fa',
    color: '#1f2937',
    fontWeight: 500,
    cursor: busy ? 'wait' : 'pointer',
    whiteSpace: 'nowrap',
    fontSize: 13,
    marginTop: 0,
    lineHeight: 1.3,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <input
        placeholder={placeholder}
        style={{ ...inputStyle, width: '100%', minWidth: 0 }}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontSize: 13 }}>
        <button type="button" onClick={pick} disabled={busy} style={btn} title="Загрузить файл на сервер (pdf, doc, xls, ppt, html, zip, картинка)">
          {busy ? 'Загрузка…' : '📎 Загрузить файл'}
        </button>
        {uploaded && (
          <>
            <a
              href={materialsHref(value)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1a73e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
              title="Открыть загруженный файл"
            >
              {fileLabel || materialsFileName(value)}
            </a>
            <button type="button" onClick={clear} title="Убрать файл" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', padding: 0, marginTop: 0, lineHeight: 1 }}>×</button>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.htm,.html,.zip,.jpg,.jpeg,.png,.gif,.webp"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}
