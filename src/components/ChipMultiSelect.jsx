import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ChipMultiSelect.css';

function ChipMultiSelect({ options = [], value = [], onChange, placeholder = 'Выберите…', disabled = false, style }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  console.log('🔍 ChipMultiSelect render:', { value, options: options.length });

  const selected = useMemo(() => {
    const vals = Array.isArray(value) ? value : [];
    const set = new Set(vals.map(String));
    const matched = options.filter((o) => set.has(String(o.value)));
    const matchedSet = new Set(matched.map((o) => String(o.value)));
    const missing = vals
      .filter((v) => !matchedSet.has(String(v)))
      .map((v) => ({ value: v, label: String(v) }));
    return [...matched, ...missing];
  }, [options, value]);

  const available = useMemo(() => {
    const set = new Set((Array.isArray(value) ? value : []).map(String));
    let list = options.filter((o) => !set.has(String(o.value)));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((o) => String(o.label || o.value).toLowerCase().includes(q));
    }
    return list;
  }, [options, value, query]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const add = (val) => {
    if (disabled) return;
    const set = new Set((Array.isArray(value) ? value : []));
    set.add(val);
    onChange?.(Array.from(set));
    setQuery('');
  };
  const remove = (val) => {
    if (disabled) return;
    const arr = (Array.isArray(value) ? value : []).filter((v) => String(v) !== String(val));
    onChange?.(arr);
  };

  return (
    <div className="chip-multi" ref={rootRef} style={style}>
      <div className="chip-multi__control" onClick={() => !disabled && setOpen(true)}>
        {selected.map((o) => (
          <span key={String(o.value)} className="chip-multi__chip">
            {o.label ?? o.value}
            {!disabled && (
              <button type="button" aria-label="Удалить" onClick={(e) => { e.stopPropagation(); remove(o.value); }}>×</button>
            )}
          </span>
        ))}
        <input
          className="chip-multi__input"
          disabled={disabled}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={selected.length ? '' : placeholder}
          autoComplete="new-password"
          data-form-type="other"
          data-lpignore="true"
          name={`chip-multi-${Math.random()}`}
        />
      </div>
      {open && !disabled && (
        <div className="chip-multi__menu">
          {available.length ? available.map((o) => (
            <div key={String(o.value)} className="chip-multi__option" onClick={() => add(o.value)}>
              {o.label ?? o.value}
            </div>
          )) : (
            <div className="chip-multi__option chip-multi__placeholder">Нет вариантов</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChipMultiSelect;
