const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const path = require('path');
const fs = require('fs');

/**
 * Инициализация Express-приложения для обработки HTTP-запросов.
 * @type {Object}
 */
const app = express();

/**
 * Создание HTTP-сервера на основе Express-приложения.
 * @type {Object}
 */
const httpServer = createServer(app);

/**
 * Инициализация WebSocket-сервера с использованием Socket.IO.
 * Настроен с поддержкой CORS для указанного источника.
 * @type {Object}
 */
const allowedOrigins = [
  'http://217.114.10.226',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://rms-bot.com',
  'http://rms-bot.com',
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
});

/**
 * Экземпляр PrismaClient для взаимодействия с базой данных через Prisma ORM.
 * @type {Object}
 */
const prisma = new PrismaClient();

// Normalize stored vote procedures to the new "elements" format if they still
// use legacy { tokens, op } blocks. This keeps vote evaluation consistent and
// prevents runtime crashes inside the vote module.
async function normalizeVoteProcedures() {
  const toElements = (tokens = []) => {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!t || typeof t !== 'object') continue;
      if (t.type === 'token') out.push(t.value);
      else if (t.type === 'number') out.push({ value: Number(t.number) || 0, type: 'input' });
      else if (t.type === 'percent') {
        out.push({ value: ((Number(t.number) || 0) / 100), type: 'input' });
        const next = tokens[i + 1];
        if (!next || !(next.type === 'token' && next.value === '*')) out.push('*');
      }
    }
    return out;
  };

  try {
    const all = await prisma.voteProcedure.findMany();
    for (const p of all) {
      if (!Array.isArray(p.conditions)) continue;
      let needsUpdate = false;
      const next = p.conditions.map((b) => {
        if (Array.isArray(b.elements)) return { elements: b.elements, operator: b.operator || b.op || null };
        if (Array.isArray(b.tokens)) { needsUpdate = true; return { elements: toElements(b.tokens), operator: b.operator || b.op || null }; }
        return { elements: [], operator: null };
      });
      if (needsUpdate) {
        await prisma.voteProcedure.update({ where: { id: p.id }, data: { conditions: next } });
      }
    }
  } catch (e) {
    console.error('Failed to normalize vote procedures:', e?.message || e);
  }
}

// Ensure the default system division exists
async function ensureSystemDivision() {
  try {
    const name = '👥Приглашенные';
    const existing = await prisma.division.findFirst({ where: { name } });
    if (!existing) {
      await prisma.division.create({ data: { name } });
    }
  } catch (e) {
    console.error('Failed to ensure system division:', e?.message || e);
  }
}

// Ensure helper table for extra user divisions exists (for multi-group membership)
async function ensureUserExtraDivisionTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserExtraDivision" (
        id SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "divisionId" INT NOT NULL,
        CONSTRAINT "UserExtraDivision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UserExtraDivision_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UserExtraDivision_unique" UNIQUE ("userId", "divisionId")
      );
    `);
  } catch (e) {
    console.error('Failed to ensure UserExtraDivision table:', e?.message || e);
  }
}

/**
 * Порт, на котором запускается сервер.
 * @type {Number}
 */
const port = process.env.PORT || 5000;

// Request logging middleware
/**
 * Middleware для логирования входящих HTTP-запросов.
 * Выводит в консоль временную метку, метод запроса и URL.
 * @param {Object} req - Объект запроса.
 * @param {Object} res - Объект ответа.
 * @param {Function} next - Функция для передачи управления следующему middleware.
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Global error guards so the server does not crash on async timer errors
process.on('unhandledRejection', (reason, p) => {
  try {
    const msg = reason && reason.stack ? reason.stack : String(reason);
    console.error('Unhandled promise rejection:', msg);
  } catch {}
});
process.on('uncaughtException', (err) => {
  try {
    const msg = err && err.stack ? err.stack : String(err);
    console.error('Uncaught exception:', msg);
  } catch {}
});

// Prisma middleware
/**
 * Middleware для прикрепления экземпляра PrismaClient к объекту запроса.
 * Добавляет `req.prisma` для доступа к базе данных в маршрутах.
 * Логирует успешное прикрепление Prisma.
 * @param {Object} req - Объект запроса.
 * @param {Object} res - Объект ответа.
 * @param {Function} next - Функция для передачи управления следующему middleware.
 */
app.use((req, res, next) => {
  req.prisma = prisma;
  console.log('Prisma прикреплён к запросу:', !!req.prisma);
  next();
});

// CORS configuration
/**
 * Middleware для настройки CORS (Cross-Origin Resource Sharing).
 * Разрешает запросы только с указанного источника, определяет допустимые методы и заголовки.
 * Поддерживает предварительные запросы (OPTIONS) с кодом состояния 204.
 */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

/**
 * Middleware для парсинга тел запросов в формате JSON.
 */
app.use(express.json());

// Normalize procedures in background on startup
(async () => {
  try { await normalizeVoteProcedures(); } catch {}
  try { await ensureSystemDivision(); } catch {}
  try { await ensureUserExtraDivisionTable(); } catch {}
})();

// PostgreSQL notifications
/**
 * Клиент PostgreSQL для подключения к базе данных и получения уведомлений.
 * Использует строку подключения для локальной базы `voting`.
 * @type {Object}
 */
const pgClient = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/voting',
});
pgClient.connect();

/**
 * Подписка на каналы PostgreSQL для получения уведомлений.
 * Слушает каналы `vote_result_channel`, `meeting_status_channel`, `user_status_channel`.
 */
pgClient.query('LISTEN vote_result_channel');
pgClient.query('LISTEN meeting_status_channel');
pgClient.query('LISTEN user_status_channel');

/**
 * Обработчик уведомлений PostgreSQL.
 * Парсит уведомления из каналов `vote_result_channel`, `meeting_status_channel`, `user_status_channel`
 * и транслирует их через WebSocket-события в реальном времени.
 * Логирует полученные данные и отправляемые события.
 */
pgClient.on('notification', (msg) => {
  if (msg.channel === 'vote_result_channel') {
    console.log('Получено уведомление PostgreSQL для vote_result_channel:', msg.payload);
    const data = JSON.parse(msg.payload);
    if (data.voteStatus === 'PENDING') {
      console.log('Отправка события new-vote-result:', data);
      io.emit('new-vote-result', { ...data, createdAt: new Date(data.createdAt).toISOString() });
    } else if (data.voteStatus === 'ENDED') {
      console.log('Отправка события vote-ended:', data);
      io.emit('vote-ended', data);
      // Correct decision if all abstained or no YES/NO votes
      (async () => {
        try {
          const id = Number(data.id || data.voteResultId);
          if (Number.isFinite(id) && (Number(data.votesFor) === 0 && Number(data.votesAgainst) === 0) && (Number(data.votesAbstain) > 0 || Number(data.votesFor) + Number(data.votesAgainst) + Number(data.votesAbstain) === 0)) {
            const updated = await prisma.voteResult.update({ where: { id }, data: { decision: 'Не принято' } });
            await pgClient.query(`NOTIFY vote_result_channel, '${JSON.stringify({ ...data, decision: 'Не принято' })}'`);
          }
        } catch {}
      })();
      // Ensure agenda state reflects finished vote when ended by timer
      (async () => {
        try {
          await prisma.agendaItem.update({
            where: { id: Number(data.agendaItemId) },
            data: { completed: true, activeIssue: false, voting: false },
          });
          await pgClient.query(`NOTIFY meeting_status_channel, '${JSON.stringify({ id: Number(data.agendaItemId), meetingId: Number(data.meetingId), activeIssue: false, completed: true })}'`);
        } catch (e) {
          console.error('Failed to mark agenda item completed on vote end:', e?.message || e);
        }
      })();
    } else if (data.voteStatus === 'APPLIED') {
      console.log('Отправка события vote-applied:', data);
      io.emit('vote-applied', data);
    } else if (data.voteStatus === 'CANCELLED') {
      console.log('Отправка события vote-cancelled:', data);
      io.emit('vote-cancelled', data);
    }
  } else if (msg.channel === 'meeting_status_channel') {
    console.log('Получено уведомление PostgreSQL для meeting_status_channel:', msg.payload);
    const data = JSON.parse(msg.payload);
    if (data.status) {
      io.emit('meeting-status-changed', data);
      if (data.status === 'COMPLETED') {
        io.emit('meeting-ended');
      }
    } else {
      console.log('Отправка события agenda-item-updated:', data);
      io.emit('agenda-item-updated', {
        id: data.id,
        meetingId: data.meetingId,
        activeIssue: data.activeIssue,
        completed: data.completed
      });
    }
  } else if (msg.channel === 'user_status_channel') {
    console.log('Получено уведомление PostgreSQL для user_status_channel:', msg.payload);
    const data = JSON.parse(msg.payload);
    io.emit('user-status-changed', { userId: data.id, isOnline: data.isOnline });
  }
});

// Health check
/**
 * @api {get} /api/health Проверка состояния сервера
 * @apiName ПроверкаСостояния
 * @apiGroup Система
 * @apiDescription Возвращает статус работы сервера. Используется для мониторинга доступности API и подтверждения, что сервер функционирует корректно.
 * @apiSuccess {Object} status Объект состояния сервера.
 * @apiSuccess {String} status.status Статус сервера (`ok` при успешной работе).
 * @apiSuccessExample {json} Пример успешного ответа:
 *     {
 *         "status": "ok"
 *     }
 * @apiExample {curl} Пример запроса:
 *     curl http://217.114.10.226:5000/api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
/**
 * Подключение маршрутов API из отдельных модулей.
 * Каждый модуль обрабатывает определённую часть функционала системы (аутентификация, пользователи, заседания и т.д.).
 * Некоторые модули принимают экземпляры `prisma` и/или `pgClient` для доступа к базе данных и уведомлениям.
 */
app.use('/api/test', require(path.join(__dirname, 'root/test.cjs')));
app.use('/api', require('./root/auth.cjs'));
app.use('/api/users', require('./root/users.cjs')(prisma));
app.use('/api/divisions', require('./root/divisions.cjs'));
app.use('/api/meetings', require('./root/meetings.cjs')(prisma, pgClient, io));
app.use('/api/device-links', require('./root/device-links.cjs'));
app.use('/api-docs', require('./root/swagger.cjs'));
app.use('/api/users/excel', require('./root/excel.cjs'));
app.use('/api/meetings/excel', require('./root/meetings-excel.cjs'));
app.use('/api', require('./root/agenda-items.cjs')(prisma, pgClient, io));
app.use('/api', require('./root/vote-procedures.cjs')(prisma));
app.use('/api', require('./root/vote-templates.cjs')(prisma));
app.use('/api/duration-templates', require('./root/duration-templates.cjs'));
app.use('/api', require('./root/vote.cjs')(prisma, pgClient, io));
app.use('/api/televic', require('./root/televic.cjs')(prisma, pgClient, io));

// Manual end of vote for an agenda item
// Important: implemented here to avoid touching files in api/root
app.post('/api/vote-results/:agendaItemId/end', async (req, res) => {
  const { agendaItemId } = req.params;
  const agendaId = parseInt(agendaItemId, 10);
  if (!agendaId || Number.isNaN(agendaId)) {
    return res.status(400).json({ error: 'Invalid agendaItemId' });
  }

  // Helpers compatible with both old (tokens/op) and new (elements/operator) formats
  const tokensToElements = (tokens = []) => {
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!t || typeof t !== 'object') continue;
      if (t.type === 'token') {
        out.push(t.value);
      } else if (t.type === 'number') {
        out.push({ value: Number(t.number) || 0, type: 'input' });
      } else if (t.type === 'percent') {
        out.push({ value: ((Number(t.number) || 0) / 100), type: 'input' });
        const next = tokens[i + 1];
        if (!next || !(next.type === 'token' && next.value === '*')) {
          out.push('*');
        }
      }
    }
    return out;
  };

  // Maps a selector token to a numeric value from context
  const valueFromToken = (value, type, ctx) => {
    if (type === 'input') return Number(value) || 0;
    if (!value || typeof value !== 'string') return 0;

    const v = value.toLowerCase();
    // Heuristic mapping tolerant to wording
    if (/(общ|вс[её]го).*(участ)/.test(v) && !/(онлайн|on ?line)/.test(v)) return ctx.totalParticipants;
    if (/(онлайн|on ?line)/.test(v)) return ctx.totalOnlineParticipants;
    if (/(вс[её]го).*(голос)/.test(v)) return ctx.totalVotes;
    if (/\bза\b/.test(v)) return ctx.votesFor;
    if (/(против)/.test(v)) return ctx.votesAgainst;
    if (/(воздерж)/.test(v)) return ctx.votesAbstain;
    if (/(отсутств)/.test(v)) return ctx.votesAbsent;
    return 0;
  };

  const evaluateElements = (elements, ctx) => {
    if (!Array.isArray(elements)) return false;
    const stack = [];
    const ops = [];

    const precedence = (op) => {
      switch (op) {
        case '*': case '/': return 3;
        case '+': case '-': return 2;
        case '>': case '<': case '>=': case '<=': case '=': return 1;
        case 'AND': case 'OR': case 'XOR': case 'ANDNOT': return 0;
        default: return -1;
      }
    };

    const applyOp = (op) => {
      const b = stack.pop();
      const a = stack.pop();
      switch (op) {
        case '*': stack.push(a * b); break;
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '/': stack.push(b === 0 ? 0 : a / b); break;
        case '>': stack.push(a > b); break;
        case '>=': stack.push(a >= b); break;
        case '<': stack.push(a < b); break;
        case '<=': stack.push(a <= b); break;
        case '=': stack.push(a == b); break; // intentional loose equality, mirrors current logic
        case 'AND': stack.push(Boolean(a) && Boolean(b)); break;
        case 'OR': stack.push(Boolean(a) || Boolean(b)); break;
        case 'XOR': stack.push(Boolean(a) !== Boolean(b)); break;
        case 'ANDNOT': stack.push(Boolean(a) && !Boolean(b)); break;
        default: break;
      }
    };

    const norm = (token) => {
      if (typeof token !== 'string') return token;
      const t = token.trim().toUpperCase();
      if (t === 'И') return 'AND';
      if (t === 'ИЛИ') return 'OR';
      if (t === 'XOR' || t === 'ИСЛИ') return 'XOR';
      if (t === 'И-НЕ' || t === 'ANDNOT') return 'ANDNOT';
      return token;
    };

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const v = typeof el === 'string' ? norm(el) : el.value;
      const t = typeof el === 'string' ? 'select' : el.type;

      if (v === '(') {
        ops.push(v);
      } else if (v === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') applyOp(ops.pop());
        if (ops[ops.length - 1] === '(') ops.pop();
      } else if (['*','+','-','/','>','<','>=','<=','=','AND','OR','XOR','ANDNOT'].includes(v)) {
        while (ops.length && precedence(ops[ops.length - 1]) >= precedence(v)) applyOp(ops.pop());
        ops.push(v);
      } else {
        stack.push(valueFromToken(v, t, ctx));
      }
    }
    while (ops.length) applyOp(ops.pop());
    return Boolean(stack.pop());
  };

  try {
    // Find the latest vote result for this agenda item
    const finalVoteResult = await prisma.voteResult.findFirst({
      where: { agendaItemId: agendaId },
      orderBy: { createdAt: 'desc' },
      include: { meeting: { include: { divisions: true } } },
    });
    if (!finalVoteResult) return res.status(404).json({ error: 'Vote result not found' });

    // Gather votes and participants
    const votes = await prisma.vote.findMany({ where: { agendaItemId: agendaId } });
    const votedUserIds = [...new Set(votes.map(v => v.userId))];

    const participants = await prisma.user.findMany({
      where: {
        divisionId: { in: finalVoteResult.meeting.divisions ? finalVoteResult.meeting.divisions.map(d => d.id) : [] },
        isAdmin: false,
      },
    });

    let notVotedCount = 0;
    for (const p of participants) if (!votedUserIds.includes(p.id)) notVotedCount += 1;

    const ctx = {
      totalParticipants: participants.length,
      totalOnlineParticipants: await prisma.user.count({ where: { divisionId: { in: finalVoteResult.meeting.divisions ? finalVoteResult.meeting.divisions.map(d => d.id) : [] }, isAdmin: false, isOnline: true } }),
      totalVotes: (finalVoteResult.votesFor + finalVoteResult.votesAgainst + finalVoteResult.votesAbstain),
      votesFor: finalVoteResult.votesFor,
      votesAgainst: finalVoteResult.votesAgainst,
      votesAbstain: finalVoteResult.votesAbstain,
      votesAbsent: notVotedCount,
    };

    // Load procedure and evaluate with backward compatibility
    const procedure = await prisma.voteProcedure.findUnique({ where: { id: finalVoteResult.procedureId } });
    let decision = null;

    // Hard safety: if все воздержались или нет ни одного голоса «за/против» — решение не принято
    if ((finalVoteResult.votesFor === 0 && finalVoteResult.votesAgainst === 0) && (finalVoteResult.votesAbstain > 0 || ctx.totalVotes === 0)) {
      decision = 'Не принято';
    }
    if (procedure && Array.isArray(procedure.conditions) && procedure.conditions.length) {
      const blocks = procedure.conditions.map((b) => {
        if (Array.isArray(b.elements)) return { elements: b.elements, operator: b.operator || b.op || null };
        if (Array.isArray(b.tokens)) return { elements: tokensToElements(b.tokens), operator: b.operator || b.op || null };
        return { elements: [], operator: null };
      });
      let final = null;
      for (let i = 0; i < blocks.length; i++) {
        const cur = evaluateElements(blocks[i].elements, ctx);
        if (i === 0) final = cur;
        else {
          const prevOp = (blocks[i - 1].operator || 'AND').toString().toUpperCase();
          if (prevOp === 'AND' || prevOp === 'И') final = final && cur;
          else if (prevOp === 'OR' || prevOp === 'ИЛИ') final = final || cur;
          else if (prevOp === 'XOR') final = Boolean(final) !== Boolean(cur);
          else if (prevOp === 'ANDNOT' || prevOp === 'И-НЕ') final = Boolean(final) && !Boolean(cur);
          else final = final && cur;
        }
      }
      const positive = Boolean(final);
      const trueText = procedure.resultIfTrue || 'Принято';
      decision = positive ? trueText : (trueText === 'Принято' ? 'Не принято' : 'Принято');
    } else {
      // Fallback: simple majority if no conditions
      if (!decision) {
        decision = finalVoteResult.votesFor > finalVoteResult.votesAgainst ? 'Принято' : 'Не принято';
      }
    }

    const updatedVoteResult = await prisma.voteResult.update({
      where: { id: finalVoteResult.id },
      data: { voteStatus: 'ENDED', votesAbsent: notVotedCount, decision },
    });

    await prisma.agendaItem.update({ where: { id: agendaId }, data: { voting: false, activeIssue: false, completed: true } });

    // Broadcast agenda item state change to connected clients
    try {
      await pgClient.query(`NOTIFY meeting_status_channel, '${JSON.stringify({ id: agendaId, meetingId: finalVoteResult.meetingId, activeIssue: false, completed: true })}'`);
    } catch {}

    const payload = { ...updatedVoteResult, createdAt: updatedVoteResult.createdAt instanceof Date ? updatedVoteResult.createdAt.toISOString() : updatedVoteResult.createdAt };
    await pgClient.query(`NOTIFY vote_result_channel, '${JSON.stringify(payload)}'`);

    res.json({ success: true, voteResult: updatedVoteResult });
  } catch (error) {
    console.error('Error finishing vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection
/**
 * Обработчик подключения клиентов через WebSocket с использованием Socket.IO.
 * Логирует события подключения и отключения клиентов для отладки.
 */
io.on('connection', (socket) => {
  console.log('Клиент подключился:', socket.id);
  socket.on('disconnect', (reason) => {
    console.log('Клиент отключился:', socket.id, 'Причина:', reason);
  });
});

// =============================
// Socket.IO: CoCon connector NS
// =============================
const connectors = new Map(); // socket.id -> { connectorId, topic, roomId, lastHello, hello }
const pendingCommands = new Map(); // id -> { resolve, reject, timer }

const coconNS = io.of('/cocon-connector');

coconNS.on('connection', (socket) => {
  const { connectorId, topic, roomId, token } = socket.handshake?.auth || {};
  connectors.set(socket.id, {
    connectorId: connectorId || null,
    topic: topic || 'default-topic',
    roomId: roomId || null,
    lastHello: null,
    hello: null,
  });
  console.log('[cocon] connection', socket.id, { connectorId, topic, roomId });

  socket.on('connector:hello', (data) => {
    const entry = connectors.get(socket.id);
    if (entry) {
      entry.lastHello = new Date().toISOString();
      entry.hello = data || {};
      connectors.set(socket.id, entry);
    }
    socket.emit('connector:hello:ack', { ts: Date.now(), sessionId: socket.id });
    console.log('[cocon] hello', socket.id, data && data.connectorId);
  });

  socket.on('connector:command:ack', (msg) => {
    console.log('[cocon] ack', socket.id, msg);
  });

  socket.on('connector:command:result', (msg) => {
    console.log('[cocon] result', socket.id, msg && msg.id, msg && msg.ok);
    if (msg && msg.id && pendingCommands.has(msg.id)) {
      const entry = pendingCommands.get(msg.id);
      clearTimeout(entry.timer);
      pendingCommands.delete(msg.id);
      entry.resolve(msg);
    }
  });

  socket.on('connector:event', async (evt) => {
    try {
      if (!evt || !evt.type) return;
      if (evt.type === 'vote-cast') {
        await require('axios').post(`http://127.0.0.1:${port}/api/vote-by-result`, {
          userId: evt.userId,
          voteResultId: evt.voteResultId,
          choice: evt.choice,
        });
      } else if (evt.type === 'BadgeEvent') {
        // Handle BadgeEvent from connector
        const { delegateId, badgeInserted } = evt.data || {};

        if (delegateId === undefined) return;

        console.log(`[BadgeEvent] Delegate ${delegateId}: badge ${badgeInserted ? 'inserted' : 'removed'}`);

        // Find user by televicExternalId
        const user = await prisma.user.findUnique({
          where: { televicExternalId: String(delegateId) }
        });

        if (!user) {
          console.log(`[BadgeEvent] No user found with televicExternalId=${delegateId}`);
          return;
        }

        // Update user badge status in database
        await prisma.user.update({
          where: { id: user.id },
          data: { isBadgeInserted: badgeInserted }
        });

        console.log(`[BadgeEvent] User ${user.name} (id=${user.id}): badge ${badgeInserted ? 'inserted' : 'removed'}`);

        // Emit to all connected clients
        io.emit('badge-status-changed', {
          userId: user.id,
          isBadgeInserted: badgeInserted
        });
      }
    } catch (e) {
      console.error('[cocon] connector:event error', e.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[cocon] disconnect', socket.id, reason);
    connectors.delete(socket.id);
  });
});

// HTTP endpoint to inspect current connector sessions
app.get('/api/connectors', (req, res) => {
  const list = [];
  connectors.forEach((v, k) => list.push({ socketId: k, ...v }));
  res.json({ count: list.length, items: list });
});

function findConnectorSocket({ topic, roomId }) {
  for (const [sid, info] of connectors.entries()) {
    if ((topic ? info.topic === topic : true) && (roomId ? String(info.roomId) === String(roomId) : true)) {
      const s = coconNS.sockets.get(sid);
      if (s) return s;
    }
  }
  for (const [sid] of connectors.entries()) {
    const s = coconNS.sockets.get(sid);
    if (s) return s;
  }
  return null;
}

function dispatchCommand(socket, { type, payload, timeoutMs = 10000 }) {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const timer = setTimeout(() => {
      pendingCommands.delete(id);
      reject(new Error('Command timeout'));
    }, timeoutMs);
    pendingCommands.set(id, { resolve, reject, timer });
    socket.emit('server:command:exec', { id, type, payload, timeoutMs });
  });
}

// Bridge endpoints for Televic CoCon
app.get('/api/coconagenda/GetAllDelegates', async (req, res) => {
  try {
    const topic = req.query.topic || undefined;
    const roomId = req.query.roomId || undefined;
    const sock = findConnectorSocket({ topic, roomId });
    if (!sock) return res.status(503).json({ error: 'No connector online' });
    const result = await dispatchCommand(sock, { type: 'GetAllDelegates', payload: {} });
    if (result && result.ok) return res.json(result.data || []);
    return res.status(502).json({ error: result && result.error || 'Connector returned error' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/coconagenda/GetDelegatesOnSeats', async (req, res) => {
  try {
    const topic = req.query.topic || undefined;
    const roomId = req.query.roomId || undefined;
    const sock = findConnectorSocket({ topic, roomId });
    if (!sock) return res.status(503).json({ error: 'No connector online' });
    const result = await dispatchCommand(sock, { type: 'GetDelegatesOnSeats', payload: {} });
    if (result && result.ok) return res.json(result.data || []);
    return res.status(502).json({ error: result && result.error || 'Connector returned error' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Static documentation
/**
 * Подача статической документации API из папки `../doc`.
 * Если папка не существует, выводится сообщение об ошибке в консоль.
 * Доступна по пути `/docs`.
 */
const docPath = path.join(__dirname, '../doc');
if (fs.existsSync(docPath)) {
  app.use('/docs', express.static(docPath));
} else {
  console.error(`Папка ${docPath} не существует`);
}

// Start server
/**
 * Запуск HTTP-сервера на указанном порту.
 * Выводит сообщение в консоль при успешном запуске.
 */
httpServer.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
