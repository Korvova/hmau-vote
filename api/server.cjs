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
    // Check for any reserved name variation (Приглашенные, 👥Приглашенные, etc.)
    const isReservedName = (name) => {
      try {
        if (!name || typeof name !== 'string') return false;
        const n = name.replace(/👥/g, '').trim().toLowerCase();
        return n === 'приглашенные';
      } catch {
        return false;
      }
    };

    const allDivisions = await prisma.division.findMany({ select: { id: true, name: true } });
    const sys = allDivisions.find((d) => isReservedName(d.name));

    if (sys) {
      // System division exists, ensure it has canonical name
      if (sys.name !== 'Приглашенные') {
        await prisma.division.update({
          where: { id: sys.id },
          data: { name: 'Приглашенные' }
        });
        console.log(`Updated system division id=${sys.id} to canonical name 'Приглашенные'`);
      }
    } else {
      // Create system division with canonical name
      await prisma.division.create({ data: { name: 'Приглашенные' } });
      console.log('Created system division with canonical name');
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
  connectionString: process.env.DATABASE_URL || 'postgresql://votingapp:votingapp_2025!@postgres:5432/voting',
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
      // Safely convert createdAt to ISO string if present
      const payload = { ...data };
      if (data.createdAt) {
        try {
          payload.createdAt = new Date(data.createdAt).toISOString();
        } catch (e) {
          // If invalid date, use current time
          payload.createdAt = new Date().toISOString();
        }
      }
      io.emit('new-vote-result', payload);
    } else if (data.voteStatus === 'ENDED') {
      console.log('Отправка события vote-ended:', data);
      io.emit('vote-ended', data);
      // Correct decision if all abstained or no YES/NO votes (do NOT send NOTIFY to avoid infinite loop)
      (async () => {
        try {
          const id = Number(data.id || data.voteResultId);
          if (Number.isFinite(id) && (Number(data.votesFor) === 0 && Number(data.votesAgainst) === 0) && (Number(data.votesAbstain) > 0 || Number(data.votesFor) + Number(data.votesAgainst) + Number(data.votesAbstain) === 0)) {
            await prisma.voteResult.update({ where: { id }, data: { decision: 'Не принято' } });
            // DO NOT send NOTIFY here - it creates infinite loop!
          }
        } catch {}
      })();
      // FIXED: When vote ends, only stop voting - do NOT mark agenda as completed
      // Agenda items should only be completed when user explicitly clicks "Завершить вопрос" button
      (async () => {
        try {
          const agendaItem = await prisma.agendaItem.findUnique({ where: { id: Number(data.agendaItemId) } });
          if (agendaItem) {
            await prisma.agendaItem.update({
              where: { id: Number(data.agendaItemId) },
              data: { voting: false }, // Only stop voting, keep activeIssue and completed as is
            });
            await pgClient.query(`NOTIFY meeting_status_channel, '${JSON.stringify({ id: Number(data.agendaItemId), meetingId: Number(data.meetingId), voting: false })}'`);
          }
        } catch (e) {
          console.error('Failed to update agenda item on vote end:', e?.message || e);
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
app.use('/api/duration-templates', require('./root/duration-templates.cjs')(prisma));
app.use('/api', require('./root/vote.cjs')(prisma, pgClient, io));
app.use('/api/televic', require('./root/televic.cjs')(prisma, pgClient, io));
app.use('/api/screen-configs', require('./root/screen-configs.cjs'));
app.use('/api/screen-uploads', require('./root/screen-uploads.cjs'));
app.use('/api/contacts', require('./root/contacts.cjs'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

    // Gather votes and participants — только голоса ТЕКУЩЕГО голосования
    const votes = await prisma.vote.findMany({ where: { voteResultId: finalVoteResult.id } });
    const votedUserIds = [...new Set(votes.map(v => v.userId))];

    // FIXED: Get all divisions and filter out "Приглашенные" (invited guests)
    const allDivisions = finalVoteResult.meeting.divisions || [];
    const regularDivisions = allDivisions.filter(d => {
      if (!d || !d.name) return true;
      const name = d.name.replace(/👥/g, '').trim().toLowerCase();
      return name !== 'приглашенные';
    });

    const participants = await prisma.user.findMany({
      where: {
        divisionId: { in: regularDivisions.map(d => d.id) },
        isAdmin: false,
      },
    });

    // «Не голосовали»: не голосовал сам и его доверенность не использована
    const proxiesForEnd = await prisma.proxy.findMany({ where: { meetingId: finalVoteResult.meetingId } });
    const votedSetEnd = new Set(votedUserIds);
    const exercisedGiversEnd = new Set(proxiesForEnd.filter(p => votedSetEnd.has(p.toUserId)).map(p => p.fromUserId));
    let notVotedCount = 0;
    for (const p of participants) if (!votedSetEnd.has(p.id) && !exercisedGiversEnd.has(p.id)) notVotedCount += 1;

    const ctx = {
      totalParticipants: participants.length,
      // FIXED: Count only regular participants (exclude invited guests) for online count
      totalOnlineParticipants: await prisma.user.count({ where: { divisionId: { in: regularDivisions.map(d => d.id) }, isAdmin: false, isOnline: true } }),
      totalVotes: (finalVoteResult.votesFor + finalVoteResult.votesAgainst + finalVoteResult.votesAbstain),
      votesFor: finalVoteResult.votesFor,
      votesAgainst: finalVoteResult.votesAgainst,
      votesAbstain: finalVoteResult.votesAbstain,
      votesAbsent: notVotedCount,
    };

    // Решение считаем ТОЙ ЖЕ функцией, что и при завершении по таймеру
    // (собственный распознаватель ниже — только запасной вариант: его regex
    // \bза\b не работал с кириллицей и «За» всегда давал 0)
    let decision = null;
    try {
      const { calculateDecision } = require('./root/vote.cjs');
      if (typeof calculateDecision === 'function') {
        decision = await calculateDecision(prisma, finalVoteResult.id);
        console.log(`[EndVote] Decision via calculateDecision: ${decision}`);
      }
    } catch (e) {
      console.error('[EndVote] calculateDecision failed, falling back:', e.message);
      decision = null;
    }

    // Load procedure and evaluate with backward compatibility
    const procedure = await prisma.voteProcedure.findUnique({ where: { id: finalVoteResult.procedureId } });

    // Hard safety: if все воздержались или нет ни одного голоса «за/против» — решение не принято
    if (decision === null && (finalVoteResult.votesFor === 0 && finalVoteResult.votesAgainst === 0) && (finalVoteResult.votesAbstain > 0 || ctx.totalVotes === 0)) {
      decision = 'Не принято';
    }
    if (decision === null && procedure && Array.isArray(procedure.conditions) && procedure.conditions.length) {
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

    // FIXED: Only stop voting, do NOT mark agenda as completed
    // Agenda items should only be completed when user explicitly clicks "Завершить вопрос" button
    await prisma.agendaItem.update({ where: { id: agendaId }, data: { voting: false } });

    // Broadcast agenda item state change to connected clients
    try {
      await pgClient.query(`NOTIFY meeting_status_channel, '${JSON.stringify({ id: agendaId, meetingId: finalVoteResult.meetingId, voting: false })}'`);
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
        console.log(`[BadgeEvent] DEBUG: Looking for user with televicExternalId='${String(delegateId)}'`);

        // Find user by televicExternalId
        const user = await prisma.user.findUnique({
          where: { televicExternalId: String(delegateId) }
        });

        console.log(`[BadgeEvent] DEBUG: Query result:`, user ? `id=${user.id}, name=${user.name}, televicExternalId=${user.televicExternalId}` : 'null');

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

  // Handle logs from connector
  socket.on('connector:log', (data) => {
    const { timestamp, message } = data || {};
    console.log(`[CONNECTOR] ${timestamp} ${message}`);
  });

  // Handle voting results from CoCon pults
  socket.on('connector:voting:results', async (data) => {
    try {
      console.log('[VotingResults] Received voting results from connector:', JSON.stringify(data, null, 2));

      const { votes, aggregated, agendaSequence, timestamp } = data || {};

      const hasIndividualVotes = votes && Array.isArray(votes) && votes.length > 0;
      const hasAggregatedResults = aggregated && aggregated.totalVotes > 0;

      if (!hasIndividualVotes && !hasAggregatedResults) {
        console.log('[VotingResults] No votes to process (neither individual nor aggregated)');
        // Пультовых голосов нет — но подсчёт надо завершить сразу, не дожидаясь 20с fallback
        try {
          const pendingVR = await prisma.voteResult.findFirst({
            where: {
              televicResultsPending: true,
              meeting: { televicMeetingId: { not: null }, status: { in: ['WAITING', 'IN_PROGRESS'] } },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (pendingVR) {
            const cleared = await prisma.voteResult.update({
              where: { id: pendingVR.id },
              data: { televicResultsPending: false },
            });
            const p = {
              ...cleared,
              createdAt: cleared.createdAt instanceof Date ? cleared.createdAt.toISOString() : cleared.createdAt,
            };
            await pgClient.query(`NOTIFY vote_result_channel, '${JSON.stringify(p)}'`);
            console.log(`[VotingResults] Cleared televicResultsPending for vote ${pendingVR.id} (empty pult results)`);
          }
        } catch (e) {
          console.error('[VotingResults] Failed to clear pending on empty results:', e.message);
        }
        return;
      }

      if (hasIndividualVotes) {
        console.log(`[VotingResults] Processing ${votes.length} individual votes for agenda sequence ${agendaSequence}`);
      }
      if (hasAggregatedResults) {
        console.log(`[VotingResults] Processing aggregated results: FOR=${aggregated.votesFor}, AGAINST=${aggregated.votesAgainst}, ABSTAIN=${aggregated.votesAbstain}`);
      }

      // Find latest vote result in active CoCon-enabled meeting
      // Don't filter by voteStatus - results may arrive after voting was applied/ended
      // Just find the most recent VoteResult in any meeting with televicMeetingId
      const activeVoteResult = await prisma.voteResult.findFirst({
        where: {
          meeting: {
            televicMeetingId: { not: null },
            status: { in: ['WAITING', 'IN_PROGRESS'] } // Only active meetings
          }
        },
        orderBy: { createdAt: 'desc' }, // Most recent vote result
        include: {
          agendaItem: true,
          meeting: { include: { divisions: true } }
        }
      });

      if (!activeVoteResult) {
        console.log('[VotingResults] No vote result found in active CoCon-enabled meeting');
        return;
      }

      console.log(`[VotingResults] Found active vote result: id=${activeVoteResult.id}, agendaItemId=${activeVoteResult.agendaItemId}`);

      // Process votes: either individual or aggregated
      let successCount = 0;
      let errorCount = 0;
      let votesFor, votesAgainst, votesAbstain, votesAbsent;

      // «Не голосовали» пересчитывается с учётом голосов Televic:
      // участники подразделений заседания минус проголосовавшие минус отдавшие доверенность.
      // Гости («Приглашённые») в подсчётах не участвуют.
      const isInvitedDivisionName = (name) => String(name || '').replace(/👥/g, '').trim().toLowerCase() === 'приглашенные';
      const divisionIdsForAbsent = (activeVoteResult.meeting?.divisions || [])
        .filter(d => !isInvitedDivisionName(d.name))
        .map(d => d.id);
      const participantsForAbsent = await prisma.user.findMany({
        where: { divisionId: { in: divisionIdsForAbsent }, isAdmin: false },
        select: { id: true },
      });
      const proxiesForAbsent = await prisma.proxy.findMany({ where: { meetingId: activeVoteResult.meeting.id } });
      const gaveProxy = new Set(proxiesForAbsent.map(p => p.fromUserId));

      if (hasIndividualVotes) {
        // Process individual votes
        for (const vote of votes) {
        try {
          const { delegateId, choice, seatNumber } = vote;

          // Find user by televicExternalId
          const user = await prisma.user.findUnique({
            where: { televicExternalId: String(delegateId) }
          });

          if (!user) {
            console.log(`[VotingResults] No user found for delegateId=${delegateId}`);
            errorCount++;
            continue;
          }

          // Map choice to VoteChoice enum
          let voteChoice;
          if (choice === 'FOR') voteChoice = 'FOR';
          else if (choice === 'AGAINST') voteChoice = 'AGAINST';
          else if (choice === 'ABSTAIN') voteChoice = 'ABSTAIN';
          else {
            console.log(`[VotingResults] Unknown choice: ${choice}`);
            errorCount++;
            continue;
          }

          // Check if vote already exists
          const existingVote = await prisma.vote.findFirst({
            where: {
              userId: user.id,
              agendaItemId: activeVoteResult.agendaItemId,
              voteResultId: activeVoteResult.id
            }
          });

          if (existingVote) {
            // Update existing vote
            await prisma.vote.update({
              where: { id: existingVote.id },
              data: { choice: voteChoice }
            });
            console.log(`[VotingResults] Updated vote: user=${user.name} (${user.id}), choice=${voteChoice}`);
          } else {
            // Create new vote
            await prisma.vote.create({
              data: {
                userId: user.id,
                agendaItemId: activeVoteResult.agendaItemId,
                voteResultId: activeVoteResult.id,
                choice: voteChoice
              }
            });
            console.log(`[VotingResults] Created vote: user=${user.name} (${user.id}), choice=${voteChoice}`);
          }

          successCount++;
        } catch (voteError) {
          console.error(`[VotingResults] Error processing vote:`, voteError.message);
          errorCount++;
        }
        }

        // Calculate counters from individual votes WITH proxy weight
        const allVotes = await prisma.vote.findMany({
          where: { voteResultId: activeVoteResult.id }
        });

        // Get proxies for this meeting to calculate vote weight
        const proxies = await prisma.proxy.findMany({
          where: { meetingId: activeVoteResult.meeting.id }
        });

        // Calculate vote weight (own vote + received proxies)
        const voteWeights = new Map();
        allVotes.forEach(v => {
          const weight = 1 + proxies.filter(p => p.toUserId === v.userId).length;
          voteWeights.set(v.userId, weight);
        });

        // Count votes WITH weight (proxy multiplication)
        votesFor = allVotes.filter(v => v.choice === 'FOR')
          .reduce((sum, v) => sum + (voteWeights.get(v.userId) || 1), 0);
        votesAgainst = allVotes.filter(v => v.choice === 'AGAINST')
          .reduce((sum, v) => sum + (voteWeights.get(v.userId) || 1), 0);
        votesAbstain = allVotes.filter(v => v.choice === 'ABSTAIN')
          .reduce((sum, v) => sum + (voteWeights.get(v.userId) || 1), 0);

        // Absent: не голосовал сам и его доверенность не использована
        // (получатель проголосовал — голос отдавшего учтён весом получателя)
        const votedIds = new Set(allVotes.map(v => v.userId));
        const exercisedGivers = new Set(proxiesForAbsent.filter(p => votedIds.has(p.toUserId)).map(p => p.fromUserId));
        votesAbsent = participantsForAbsent.filter(p => !votedIds.has(p.id) && !exercisedGivers.has(p.id)).length;

        console.log(`[VotingResults] ✅ Processed ${successCount} individual votes, ${errorCount} errors`);
      } else if (hasAggregatedResults) {
        // Use aggregated results directly (no individual vote records)
        votesFor = aggregated.votesFor || 0;
        votesAgainst = aggregated.votesAgainst || 0;
        votesAbstain = aggregated.votesAbstain || 0;
        // Absent по агрегированным: каждый голос с пульта = один человек;
        // судьба доверенностей в агрегированном режиме неизвестна — не вычитаем,
        // чтобы сумма голосов и «не голосовали» сходилась с числом делегатов
        votesAbsent = Math.max(0, participantsForAbsent.length - (votesFor + votesAgainst + votesAbstain));

        console.log(`[VotingResults] ✅ Using aggregated results: FOR=${votesFor}, AGAINST=${votesAgainst}, ABSTAIN=${votesAbstain}`);
      }

      const updatedVoteResult = await prisma.voteResult.update({
        where: { id: activeVoteResult.id },
        data: {
          votesFor,
          votesAgainst,
          votesAbstain,
          votesAbsent,
          // IMPORTANT: Clear televicResultsPending flag when results arrive from connector
          // This unblocks the "Finish" button on the frontend
          televicResultsPending: false
        }
      });

      console.log(`[VotingResults] Updated counters: FOR=${votesFor}, AGAINST=${votesAgainst}, ABSTAIN=${votesAbstain}, ABSENT=${votesAbsent}`);

      // Если голосование уже завершено — пересчитать решение с учётом голосов Televic
      // (оно было вычислено в момент таймера только по сайтовым голосам)
      let finalDecision = updatedVoteResult.decision;
      if (activeVoteResult.voteStatus !== 'PENDING') {
        try {
          const dRes = await require('axios').post(`http://127.0.0.1:${port}/api/calculate-decision`, {
            voteResultId: activeVoteResult.id,
          });
          if (dRes.data && dRes.data.decision) {
            finalDecision = dRes.data.decision;
            await prisma.voteResult.update({
              where: { id: activeVoteResult.id },
              data: { decision: finalDecision },
            });
            console.log(`[VotingResults] Decision recomputed after Televic results: ${finalDecision}`);
          }
        } catch (e) {
          console.error('[VotingResults] Decision recompute failed:', e.message);
        }
      }

      // Send NOTIFY to update clients — полная запись (обязательно с meetingId,
      // иначе экраны отбросят событие как чужое)
      const payload = {
        ...updatedVoteResult,
        decision: finalDecision,
        televicResultsPending: false,
        createdAt: updatedVoteResult.createdAt instanceof Date ? updatedVoteResult.createdAt.toISOString() : updatedVoteResult.createdAt
      };
      await pgClient.query(`NOTIFY vote_result_channel, '${JSON.stringify(payload)}'`);

      // REAL-TIME UPDATE: Emit to all connected clients for live vote tracking
      io.emit('vote-result-updated', {
        voteResultId: activeVoteResult.id,
        agendaItemId: activeVoteResult.agendaItemId,
        meetingId: activeVoteResult.meetingId,
        votesFor,
        votesAgainst,
        votesAbstain,
        votesAbsent,
        totalVotes: votesFor + votesAgainst + votesAbstain,
        timestamp: new Date().toISOString()
      });

      console.log(`[VotingResults] ✅ Emitted real-time update: vote-result-updated`);
    } catch (e) {
      console.error('[VotingResults] Error:', e.message);
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
