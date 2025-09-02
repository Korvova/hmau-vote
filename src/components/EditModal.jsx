import React, { useState, useEffect } from 'react';

/**
 * Универсальное модальное окно редактирования.
 *
 * @param {boolean} open — признак того, что окно открыто.
 * @param {Object|null} data — исходные данные выбранной строки.
 * @param {Array} fields — массив конфигураций полей: { name, label, type, required, options }.
 * @param {function} onClose — вызывается при закрытии модального окна.
 * @param {function} onSubmit — вызывается при подтверждении (получает formState и пароль).
 */
function EditModal({ open, data, fields, onClose, onSubmit }) {
  const [formState, setFormState] = useState({});
  const [password, setPassword] = useState('');

  // При открытии модалки заполняем состояние исходными данными
  useEffect(() => {
    if (data && fields) {
      const initial = {};
      fields.forEach((field) => {
        initial[field.name] = data[field.name] ?? '';
      });
      setFormState(initial);
    }
  }, [data, fields]);

  // Разбиваем поля на группы: [0], [1,2], [3,4], ...
  const groupedFields = [];
  if (fields) {
    for (let i = 0; i < fields.length; ) {
      // первая группа всегда одиночная, далее — парами
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
    // Передаём собранные данные и пароль наверх
    onSubmit(formState, password);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Кнопка закрытия */}
        <button className="modal__close" onClick={onClose}>
          {/* Иконка можно оставить пустой или вставить свою */}
          ×
        </button>

        {/* Заголовок */}
        <div className="modal__heading center">
          <h2>Редактировать</h2>
        </div>

        {/* Форма */}
        <div className="form__inner">
          <form onSubmit={handleSubmit}>
            {groupedFields.map((group, groupIndex) =>
              group.length === 1 ? (
                // Одинарное поле
                <div key={groupIndex} className="form__item">
                  <div className="item__title">
                    {group[0].label}
                    {group[0].required && <sup>*</sup>}
                  </div>
                    {/* text/textarea/select */}
                  {group[0].type === 'textarea' ? (
                    <textarea
                      name={group[0].name}
                      required={group[0].required}
                      value={formState[group[0].name] ?? ''}
                      onChange={(e) => handleChange(group[0].name, e.target.value)}
                    />
                  ) : group[0].type === 'select' ? (
                    <select
                      name={group[0].name}
                      required={group[0].required}
                      value={formState[group[0].name] ?? ''}
                      onChange={(e) => handleChange(group[0].name, e.target.value)}
                    >
                      {group[0].options?.map((opt) => (
                        <option key={opt.value ?? opt} value={opt.value ?? opt}>
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
                    />
                  )}
                </div>
              ) : (
                // Группа из двух полей
                <div key={groupIndex} className="form__wrapper">
                  {group.map((field) => (
                    <div key={field.name} className="form__item">
                      <div className="item__title">
                        {field.label}
                        {field.required && <sup>*</sup>}
                      </div>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          required={field.required}
                          value={formState[field.name] ?? ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          name={field.name}
                          required={field.required}
                          value={formState[field.name] ?? ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value ?? opt} value={opt.value ?? opt}>
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
                        />
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Пароль и кнопка отправки */}
            <div className="form__submit">
              <input
                type="password"
                className="pass"
                placeholder="Пароль"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="btn btn-big">
                Применить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
