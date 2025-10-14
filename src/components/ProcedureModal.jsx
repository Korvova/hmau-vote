import React, { useEffect, useMemo, useState } from 'react';
import './ModalHeader.css';

function tokensToElements(tokens = []) {
  const elements = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'token') {
      elements.push(t.value);
    } else if (t.type === 'number') {
      elements.push({ value: t.number, type: 'input' });
    } else if (t.type === 'percent') {
      elements.push({ value: (t.number ?? 0) / 100, type: 'input' });
      const next = tokens[i + 1];
      if (!next || !(next.type === 'token' && next.value === '*')) {
        elements.push('*');
      }
    }
  }
  return elements;
}

function elementsToTokens(elements = []) {
  const tokens = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const value = typeof el === 'string' ? el : el?.value;
    const type = typeof el === 'string' ? 'token' : el?.type;

    if (type === 'input') {
      const num = Number(value);
      const next = elements[i + 1];
      const nextVal = typeof next === 'string' ? next : next?.value;
      if (nextVal === '*' && num >= 0 && num <= 1) {
        tokens.push({ type: 'percent', value: '%', number: num * 100 });
        i += 1;
      } else {
        tokens.push({ type: 'number', value: 'Число', number: num });
      }
    } else {
      tokens.push({ type: 'token', value, number: 0 });
    }
  }
  return tokens;
}

function ProcedureModal({ open, data, onClose, onSubmit, title = 'Редактировать процедуру' }) {
  const [name, setName] = useState('');
  const [resultIfTrue, setResultIfTrue] = useState('Принято');
  const [conditions, setConditions] = useState([]); 

  const TOKEN_OPTIONS = useMemo(() => [
    'Все пользователи заседания',
    'Все пользователи онлайн',
    'Всего голосов',
    '%',
    'Число',
    '>', '<', '>=', '<=', '=',
    '*', '+', '-', '/',
    'За', 'Против', 'Воздержались', 'Не голосовали',
    '(', ')',
  ], []);
  const OPERATORS = ['И', 'Или', 'Иначе', 'Кроме'];

  useEffect(() => {
    if (!open) return;
    setName(data?.name || '');
    setResultIfTrue(data?.resultIfTrue || 'Принято');
    const parsed = (() => {
      if (!data?.conditions) return [];
      try { return Array.isArray(data.conditions) ? data.conditions : []; } catch { return []; }
    })();
    if (parsed.length) {
      setConditions(parsed.map((b) => {
        if (Array.isArray(b.tokens)) {
          return { tokens: b.tokens, op: b.op || b.operator || null };
        }
        return {
          tokens: elementsToTokens(b.elements || []),
          op: b.operator || null,
        };
      }));
    } else setConditions([{ tokens: [], op: null }]);
  }, [open, data]);

  const addBlock = () => setConditions(prev => [...prev, { tokens: [], op: null }]);
  const removeBlock = (idx) => setConditions(prev => prev.filter((_, i) => i !== idx));

  const addToken = (blockIdx) => setConditions(prev => prev.map((b, i) => (
    i === blockIdx ? { ...b, tokens: [...b.tokens, { type: 'token', value: TOKEN_OPTIONS[0], number: 0 }] } : b
  )));
  const removeToken = (blockIdx) => setConditions(prev => prev.map((b, i) => (
    i === blockIdx ? { ...b, tokens: b.tokens.slice(0, Math.max(0, b.tokens.length - 1)) } : b
  )));

  const changeTokenKind = (blockIdx, tokenIdx, next) => setConditions(prev => prev.map((b, i) => {
    if (i !== blockIdx) return b;
    const tokens = b.tokens.slice();
    const type = next === 'Число' ? 'number' : (next === '%' ? 'percent' : 'token');
    tokens[tokenIdx] = { type, value: next, number: 0 };
    return { ...b, tokens };
  }));
  const changeTokenNumber = (blockIdx, tokenIdx, value) => setConditions(prev => prev.map((b, i) => {
    if (i !== blockIdx) return b;
    const tokens = b.tokens.slice();
    const n = Number(value);
    const cur = tokens[tokenIdx] || { type: 'number', value: 'Число' };
    tokens[tokenIdx] = { ...cur, number: isNaN(n) ? 0 : n };
    return { ...b, tokens };
  }));
  const changeOperator = (blockIdx, value) => setConditions(prev => prev.map((b, i) => (i === blockIdx ? { ...b, op: value } : b)));

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const payload = {
      name: name.trim(),
      resultIfTrue,
      conditions: conditions.map((b) => ({
        elements: tokensToElements(b.tokens || []),
        operator: b.op || null,
      })),
    };
    onSubmit?.(payload);
  };

  if (!open) return null;

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modal = { background: '#fff', borderRadius: 8, width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 24 };
  const smallBtn = { padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' };
  const redBtn = { ...smallBtn, marginTop:0, background: '#e53935', color: '#fff', width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 32, minWidth: 32, padding: '0 10px' };
  const blueBtn = { ...smallBtn,marginTop:0, background: '#2b8af8', color: '#fff', width: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 32, minWidth: 32, padding: '0 10px' };
  const input = { width: '100%', padding: '10px 12px', border: '1px solid #dcdcdc', borderRadius: 6 };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div className="modal-header">
          <span className="modal-header-spacer" aria-hidden="true" />
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Закрыть модальное окно"
            onClick={onClose}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Название процедуры</label>
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Результат, если условие выполнено</label>
          <select style={input} value={resultIfTrue} onChange={(e) => setResultIfTrue(e.target.value)}>
            <option value="Принято">Принято</option>
            <option value="Не принято">Не принято</option>
          </select>
        </div>

        <h3 style={{ margin: '16px 0 8px' }}>Условия</h3>
        {conditions.map((block, idx) => (
          <div key={idx} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <strong>Условие {idx + 1}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {block.tokens.map((t, ti) => (
                <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.type === 'number' ? (
                    <input
                      type="number"
                      placeholder="Число"
                      style={{ ...input, width: 110 }}
                      value={t.number ?? 0}
                      onChange={(e) => changeTokenNumber(idx, ti, e.target.value)}
                    />
                  ) : t.type === 'percent' ? (
                    <input
                      type="number"
                      placeholder="%"
                      min={0}
                      max={100}
                      style={{ ...input, width: 110 }}
                      value={t.number ?? 0}
                      onChange={(e) => changeTokenNumber(idx, ti, e.target.value)}
                    />
                  ) : (
                    <select
                      style={{ ...input, width: 220 }}
                      value={t.value || TOKEN_OPTIONS[0]}
                      onChange={(e) => changeTokenKind(idx, ti, e.target.value)}
                    >
                      {TOKEN_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              <button type="button" style={redBtn} onClick={() => removeToken(idx)}>−</button>
              <button type="button" style={blueBtn} onClick={() => addToken(idx)}>+</button>
            </div>

            {idx < conditions.length - 1 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Оператор</label>
                <select style={{ ...input, width: 200 }} value={block.op || 'И'} onChange={(e) => changeOperator(idx, e.target.value)}>
                  {OPERATORS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <button type="button" style={{ ...redBtn, padding: '0 12px' }} onClick={() => removeBlock(idx)}>Удалить блок</button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" style={blueBtn} onClick={addBlock}>Добавить условие</button>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="button" style={redBtn} onClick={onClose}>Отмена</button>
          <button type="button" style={blueBtn} onClick={handleSubmit}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

export default ProcedureModal;
