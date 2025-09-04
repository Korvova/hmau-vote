import React, { useState } from 'react';
import usePersistentList from '../utils/usePersistentList.js';
import EditModal from '../components/EditModal.jsx';

const LS_KEY = 'rms_template_v1';

function TemplatePage() {
  const [configOpen, setConfigOpen] = useState(true);

  // Стартовые строки из текущей вёрстки (структуру таблицы НЕ меняем)
  const initialRows = [
    { id: 1, title: 'Внесение изменений в Устав (полномочия комиссий)' },
    { id: 2, title: 'Внесение изменений в Устав (полномочия комиссий)' },
    { id: 3, title: 'Внесение изменений в Устав (полномочия комиссий)' },
    { id: 4, title: 'Внесение изменений в Устав (полномочия комиссий)' },
  ];

  const [rows, setRows] = usePersistentList(LS_KEY, initialRows);

  // Модалка
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  // Поля формы (НЕ меняем структуру таблицы — редактируем только «Название»)
  const fields = [
    { name: 'title', label: 'Название', type: 'text', required: true },
  ];

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, title: '' });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected(row);
    setOpen(true);
  };

  const handleSubmit = (formData /*, password */) => {
    if (isAdd) {
      const newId = (rows.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
      setRows((prev) => [{ id: newId, ...formData }, ...prev]);
    } else if (selected) {
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...formData } : r)));
    }
    setOpen(false);
  };

  return (
    <>
      {/* HEADER */}
      <header className="page">
        <div className="header__top">
          <div className="container">
            <div className="wrapper">
              <div className="header__logo">
                <div className="logo__inner">
                  <a href="/"><img src="/img/logo.png" alt="" /></a>
                </div>
              </div>
              <div className="header__user">
                <div className="user__inner">
                  <a href="#!" className="support"><img src="/img/icon_1.png" alt="" />Поддержка</a>
                  <ul>
                    <li className="menu-children">
                      <a href="#!"><img src="/img/icon_2.png" alt="" />admin@admin.ru</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="header__menu">
          <div className="container">
            <div className="wrapper">
              <ul>
                <li><a href="/users">Пользователи</a></li>
                <li><a href="/divisions">Подразделения</a></li>
                <li><a href="/meetings">Заседания</a></li>
                <li><a href="/console">Пульт Заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li className="current-menu-item"><a href="/template">Шаблон голосования</a></li>
                    <li><a href="/vote">Процедура подсчета голосов</a></li>
                    <li><a href="/screen">Экран трансляции</a></li>
                    <li><a href="/linkprofile">Связать профиль с ID</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              <div className="page__top">
                <div className="top__heading">
                  <h1>Шаблон голосования</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <select>
                    <option value="По дате">По дате</option>
                    <option value="По дате 1">По дате 1</option>
                    <option value="По дате 2">По дате 2</option>
                  </select>
                  <form className="search">
                    <input type="text" placeholder="Поиск" />
                    <button type="submit"></button>
                  </form>
                  <ul className="nav">
                    <li><a href="#!"><img src="/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/img/icon_9.png" alt="" /></a></li>
                  </ul>
                </div>
              </div>

              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td className="action">
                          <ul>
                            {/* первая иконка — редактирование (структуру не меняем) */}
                            <li><a href="#!" onClick={(e) => { e.preventDefault(); handleEdit(row); }}><img src="/img/icon_24.png" alt="" /></a></li>
                            <li><a href="#!"><img src="/img/icon_25.png" alt="" /></a></li>
                            <li><a href="#!"><img src="/img/icon_26.png" alt="" /></a></li>
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <div className="wp-pagenavi">
                  <a href="#" className="previouspostslink"></a>
                  <a href="#">1</a>
                  <span>2</span>
                  <a href="#">3</a>
                  <a href="#">4</a>
                  <a href="#" className="nextpostslink"></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <EditModal
          open={isOpen}
          data={selected}
          fields={fields}
          title={isAdd ? 'Добавить шаблон' : 'Редактировать шаблон'}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </main>

      {/* FOOTER */}
      <footer>
        <section id="footer">
          <div className="container">
            <div className="wrapper">
              <p>&copy; rms-group.ru</p>
              <p>RMS Voting 1.2 – 2025</p>
            </div>
          </div>
        </section>
      </footer>
    </>
  );
}

export default TemplatePage;
