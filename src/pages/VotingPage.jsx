import React, { useState } from 'react';
import usePersistentList from '../utils/usePersistentList.js';
import EditModal from '../components/EditModal.jsx';

const LS_KEY = 'rms_voting_rules_v1';

function VotingPage() {
  const [configOpen, setConfigOpen] = useState(true);

  // Стартовые строки из текущей вёрстки
  const initialRows = [
    {
      id: 1,
      rule: 'Все пользователи онлайн х 50% > За',
      formula: 'Все пользователи онлайн x 50% > За \nЗа > Против',
      accepted: false, // Не принято
    },
    {
      id: 2,
      rule: 'Не менее 2/3 от установленного числа депутатов',
      formula: 'Все пользователи онлайн x 66,67% > За \nЗа > Против',
      accepted: true, // Принято
    },
    {
      id: 3,
      rule: 'Не менее 3/4 от установленного числа депутатов',
      formula: 'Все пользователи онлайн x 75% > За \nЗа > Против',
      accepted: true,
    },
    {
      id: 4,
      rule: 'Больше голосов «За», чем «Против»',
      formula: 'За > Против',
      accepted: true,
    },
  ];

  const [rows, setRows] = usePersistentList(LS_KEY, initialRows);
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  // Поля формы (структуру таблицы НЕ меняем)
  const fields = [
    { name: 'rule', label: 'Название правила', type: 'text', required: true },
    { name: 'formula', label: 'Формула', type: 'textarea', required: true },
    { name: 'accepted', label: 'Статус', type: 'select', required: true, options: [
      { label: 'Не принято', value: 'false' },
      { label: 'Принято', value: 'true' },
    ] },
  ];

  const renderAccepted = (a) => a ? (
    <span><img src="/img/icon_28.png" alt="" />Принято</span>
  ) : (
    <span><img src="/img/icon_27.png" alt="" />Не принято</span>
  );

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, rule: '', formula: '', accepted: false });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected(row);
    setOpen(true);
  };

  const handleSubmit = (formData /*, password */) => {
    const normalized = {
      ...formData,
      accepted: String(formData.accepted) === 'true',
    };

    if (isAdd) {
      const newId = (rows.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
      setRows((prev) => [{ id: newId, ...normalized }, ...prev]);
    } else if (selected) {
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...normalized } : r)));
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
                <li className="current-menu-item"><a href="/console">Пульт Заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/template">Шаблон голосования</a></li>
                    <li className="current-menu-item"><a href="/vote">Процедура подсчета голосов</a></li>
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
                  <h1>Процедура подсчета голосов</h1>
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
                      <th>Критерий</th>
                      <th>Формула</th>
                      <th>Принято</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.rule}</td>
                        <td dangerouslySetInnerHTML={{ __html: row.formula.replace(/\n/g, '<br />') }} />
                        <td className="accepted">{renderAccepted(row.accepted)}</td>
                        <td className="action action-small">
                          <ul>
                            {/* первая иконка — редактирование */}
                            <li><a href="#!" onClick={(e) => { e.preventDefault(); handleEdit(row); }}><img src="/img/icon_24.png" alt="" /></a></li>
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
      </main>

      {/* FOOTER */}
      <footer>
        <section id="footer">
          <div className="container">
            <div className="wrapper">
              <p>&copy; rms-group.ru</p>
              <p>RMS Voting 1.01 – 2025</p>
            </div>
          </div>
        </section>
      </footer>

      {/* MODAL */}
      <EditModal
        open={isOpen}
        data={selected}
        fields={fields}
        title={isAdd ? 'Добавить правило' : 'Редактировать правило'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default VotingPage;

