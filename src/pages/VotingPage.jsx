import React, { useEffect, useMemo, useState } from 'react';
import ProcedureModal from '../components/ProcedureModal.jsx';
import { getVoteProcedures, createVoteProcedure, updateVoteProcedure, deleteVoteProcedure } from '../utils/api.js';

function VotingPage() {
  const [configOpen, setConfigOpen] = useState(true);

  // Data
  const [rows, setRows] = useState([]); // { id, name, conditions, resultIfTrue }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selected, setSelected] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [isAdd, setAdd] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await getVoteProcedures();
        const normalized = (Array.isArray(list) ? list : []).map(p => ({ id: p.id, name: p.name, conditions: p.conditions || [], resultIfTrue: p.resultIfTrue || 'Принято' }));
        setRows(normalized);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки процедур');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stringify = useMemo(() => (proc) => {
    try {
      const blocks = (proc.conditions || []).map(b => (b.tokens || []).map(t => {
        if (t.type === 'number') return String(t.number ?? 0);
        if (t.type === 'percent') return `${t.number ?? 0}%`;
        return t.value;
      }).join(' '));
      const ops = (proc.conditions || []).map(b => b.op).filter(Boolean);
      let out = '';
      for (let i = 0; i < blocks.length; i++) {
        out += (i ? `\n${ops[i-1] || ''}\n` : '') + (blocks[i] || '');
      }
      return out || '-';
    } catch { return '-'; }
  }, []);

  const handleAdd = (e) => {
    e?.preventDefault?.();
    setAdd(true);
    setSelected({ id: null, name: '', resultIfTrue: 'Принято', conditions: [{ tokens: [], op: null }] });
    setOpen(true);
  };

  const handleEdit = (row) => {
    setAdd(false);
    setSelected({ ...row });
    setOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (isAdd) {
        const created = await createVoteProcedure(payload);
        setRows(prev => [{ id: created.id, name: created.name, conditions: created.conditions || [], resultIfTrue: created.resultIfTrue || 'Принято' }, ...prev]);
      } else if (selected?.id) {
        const updated = await updateVoteProcedure(selected.id, payload);
        setRows(prev => prev.map(r => (r.id === selected.id ? { id: updated.id, name: updated.name, conditions: updated.conditions || [], resultIfTrue: updated.resultIfTrue || 'Принято' } : r)));
      }
      setOpen(false);
    } catch (e) {
      alert(e.message || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!window.confirm('Удалить процедуру подсчёта голосов?')) return;
    try {
      await deleteVoteProcedure(id);
      setRows(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert(e.message || 'Ошибка удаления');
    }
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
                <li className="current-menu-item"><a href="/console">Пульт заседания</a></li>
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
                  <h1>Процедура подсчёта голосов</h1>
                  <a href="#!" className="btn btn-add" onClick={handleAdd}><span>Добавить</span></a>
                </div>
                <div className="top__wrapper">
                  <ul className="nav">
                    <li><a href="#!"><img src="/img/icon_8.png" alt="" /></a></li>
                    <li><a href="#!"><img src="/img/icon_9.png" alt="" /></a></li>
                  </ul>
                </div>
                {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
              </div>

              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Условия</th>
                      <th>Результат</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loading ? [] : rows).map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td dangerouslySetInnerHTML={{ __html: stringify(row).replace(/\n/g, '<br />') }} />
                        <td className="accepted">{row.resultIfTrue}</td>
                        <td className="action action-small">
                          <ul>
                            <li>
                              <a href="#!" onClick={(e) => { e.preventDefault(); handleEdit(row); }}>
                                <img src="/img/icon_24.png" alt="" />
                              </a>
                            </li>
                            <li>
                              <a href="#!" onClick={(e) => handleDelete(row.id, e)}>
                                <img src="/img/icon_26.png" alt="" />
                              </a>
                            </li>
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
              <p>RMS Voting 1.2 © 2025</p>
            </div>
          </div>
        </section>
      </footer>

      {/* MODAL */}
      <ProcedureModal
        open={isOpen}
        data={selected}
        title={isAdd ? 'Добавить процедуру' : 'Редактировать процедуру'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default VotingPage;
