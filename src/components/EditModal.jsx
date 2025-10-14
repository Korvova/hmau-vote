import React, { useState, useEffect } from 'react';
import './ModalHeader.css';
import ChipMultiSelect from './ChipMultiSelect.jsx';

function EditModal({ open, data, fields, onClose, onSubmit, title = 'Редактировать' }) {
  const [formState, setFormState] = useState({});

  useEffect(() => {
    if (data && fields) {
      const initial = {};
      fields.forEach((f) => {
        initial[f.name] = data[f.name] ?? '';
      });
      setFormState(initial);
    }
  }, [data, fields]);

  const groupedFields = [];
  if (fields) {
    for (let i = 0; i < fields.length; ) {
      if (i === 0 || fields.length === 1) {
        groupedFields.push([fields[i]]);
        i += 1;
      } else {
        groupedFields.push([fields[i], fields[i + 1]].filter(Boolean));
        i += 2;
      }
    }
  }

  const handleChange = (fieldName, value) => {
    setFormState((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formState);
  };

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  };

  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '32px',
    width: '600px',
    maxWidth: '90%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
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
        {/* Форма */}
        <form onSubmit={handleSubmit}>
          {groupedFields.map((group, idx) => (
            group.length === 1 ? (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                  {group[0].label}
                  {group[0].required && <sup>*</sup>}
                </label>
                {group[0].type === 'select' ? (
                  <select
                    name={group[0].name}
                    required={group[0].required}
                    value={formState[group[0].name] ?? ''}
                    onChange={(e) => handleChange(group[0].name, e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}
                  >
                    {group[0].options?.map((opt) => (
                      <option key={opt.value ?? opt} value={opt.value ?? opt}>
                        {opt.label ?? opt}
                      </option>
                    ))}
                  </select>
                ) : group[0].type === 'chip-multiselect' ? (
                  <ChipMultiSelect
                    options={group[0].options || []}
                    value={Array.isArray(formState[group[0].name]) ? formState[group[0].name] : []}
                    onChange={(vals) => handleChange(group[0].name, vals)}
                    placeholder={group[0].placeholder || 'Выберите…'}
                  />
                ) : group[0].type === 'multiselect' ? (
                  <select
                    multiple
                    name={group[0].name}
                    required={group[0].required}
                    value={Array.isArray(formState[group[0].name]) ? formState[group[0].name] : []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(o => o.value);
                      handleChange(group[0].name, values);
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcdcdc', height: 140 }}
                  >
                    {group[0].options?.map((opt) => (
                      <option key={opt.value ?? opt} value={String(opt.value ?? opt)}>
                        {opt.label ?? opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={group[0].type || 'text'}
                    name={group[0].name}
                    required={group[0].required}
                    value={formState[group[0].name] ?? ''}
                    onChange={(e) => handleChange(group[0].name, e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}
                  />
                )}
              </div>
            ) : (
              <div key={idx} style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                {group.map((field) => (
                  <div key={field.name} style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      {field.label}
                      {field.required && <sup>*</sup>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        required={field.required}
                        value={formState[field.name] ?? ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value ?? opt} value={opt.value ?? opt}>
                            {opt.label ?? opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'chip-multiselect' ? (
                      <ChipMultiSelect
                        options={field.options || []}
                        value={Array.isArray(formState[field.name]) ? formState[field.name] : []}
                        onChange={(vals) => handleChange(field.name, vals)}
                        placeholder={field.placeholder || 'Выберите…'}
                      />
                    ) : field.type === 'multiselect' ? (
                      <select
                        multiple
                        name={field.name}
                        required={field.required}
                        value={Array.isArray(formState[field.name]) ? formState[field.name] : []}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions).map(o => o.value);
                          handleChange(field.name, values);
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #dcdcdc', height: 140 }}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value ?? opt} value={String(opt.value ?? opt)}>
                            {opt.label ?? opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        required={field.required}
                        value={formState[field.name] ?? ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dcdcdc' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          ))}

          {/* Кнопка подтверждения */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-big"
              style={{
                padding: '12px 24px',
                backgroundColor: '#2b8af8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Применить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;

