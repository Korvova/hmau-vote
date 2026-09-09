/*import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Добавляем Router
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { rememberPcFromUrl } from './utils/useReportUserPageVisibility.js';

// Метка ПК из ?pc=<IP> (её ставит мостик Veyon) — запоминаем ДО роутинга,
// иначе редирект /user -> /login её потеряет
rememberPcFromUrl();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/hmau-vote">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);