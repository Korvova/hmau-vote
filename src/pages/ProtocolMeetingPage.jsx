import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMeeting, getAgendaItems, getUsers, getVoteResults } from '../utils/api.js';

function ProtocolMeetingPage() {
  const { id } = useParams();
  const [configOpen, setConfigOpen] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [m, ag, us] = await Promise.all([
          getMeeting(id).catch(() => null),
          getAgendaItems(id).catch(() => []),
          getUsers().catch(() => []),
        ]);
        setMeeting(m);
        const items = Array.isArray(ag) && ag.length ? ag : (Array.isArray(m?.agendaItems) ? m.agendaItems : []);
        setAgenda(items || []);
        setUsers(Array.isArray(us) ? us : []);
      } catch {}
      try {
        const rs = await getVoteResults(id).catch(() => []);
        setResults(Array.isArray(rs) ? rs : []);
      } catch {}
    })();
  }, [id]);

  const usersMap = useMemo(() => Object.fromEntries((users || []).map(u => [u.id, u.name])), [users]);

  const resultsMap = useMemo(() => {
    const map = new Map();
    for (const r of results || []) {
      const key = r.agendaItemId ?? r.agendaId ?? r.itemId ?? r.id;
      if (!map.has(key)) map.set(key, { yes: 0, no: 0, abstain: 0, text: null, accepted: undefined });
      const acc = map.get(key);
      const v = String(r.vote ?? r.value ?? r.result ?? '').toLowerCase();
      if (v.includes('за') || v === 'yes' || v === 'for' || v === '1' || v === 'true') acc.yes += 1;
      else if (v.includes('против') || v === 'no' || v === 'against' || v === '0' || v === 'false') acc.no += 1;
      else if (v.includes('воздерж') || v === 'abstain' || v === 'null' || v === '') acc.abstain += 1;
      else acc.text = (acc.text ? acc.text + '; ' : '') + (r.text || r.result || r.vote || '');
      if (typeof r.accepted === 'boolean') acc.accepted = r.accepted;
    }
    return map;
  }, [results]);

  const renderResult = (item) => {
    const key = item.id ?? item.agendaItemId ?? item.number;
    const r = resultsMap.get(key);
    if (!r) return 'Голосование не проводилось';
    const parts = [];
    if (r.yes) parts.push(`За: ${r.yes}`);
    if (r.no) parts.push(`Против: ${r.no}`);
    if (r.abstain) parts.push(`Воздерж.: ${r.abstain}`);
    const base = parts.length ? parts.join(', ') : 'Голосование не проводилось';
    if (typeof r.accepted === 'boolean') {
      return `${base} — ${r.accepted ? 'Решение принято' : 'Решение не принято'}`;
    }
    return base;
  };

  const printPdf = (e) => {
    e?.preventDefault?.();
    window.print();
  };

  return (
    <>
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
                <li><a href="/console">Пульт заседания</a></li>
                <li className={`menu-children${configOpen ? ' current-menu-item' : ''}`}>
                  <a href="#!" onClick={(e) => { e.preventDefault(); setConfigOpen(!configOpen); }}>Конфигурация</a>
                  <ul className="sub-menu" style={{ display: configOpen ? 'block' : 'none' }}>
                    <li><a href="/template">Шаблон голосования</a></li>
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

      <main>
        <section id="page">
          <div className="container">
            <div className="wrapper">
              <div className="page__top">
                <div className="top__heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h1>Протокол заседания: <span style={{ fontWeight: 700 }}>{meeting?.name || ''}</span></h1>
                  <button className="btn btn-add" onClick={printPdf}><span>Скачать PDF</span></button>
                </div>
              </div>

              <div className="page__table">
                <table>
                  <thead>
                    <tr>
                      <th>Номер</th>
                      <th>Вопрос</th>
                      <th>Докладчик</th>
                      <th>Итоги голосования</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(agenda || []).map((a, idx) => (
                      <tr key={a.id || idx}>
                        <td>{a.number ?? (idx + 1)}</td>
                        <td>{a.title}</td>
                        <td>{a.speaker || usersMap[a.speakerId] || ''}</td>
                        <td>{renderResult(a)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </>
  );
}

export default ProtocolMeetingPage;
