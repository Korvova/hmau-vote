const { io } = require('socket.io-client');
const os = require('os');
const crypto = require('crypto');

function ensureConnectorId(store) {
  let id = store.get('connector.connectorId');
  if (!id || typeof id !== 'string' || id.length < 4) {
    id = 'conn-' + crypto.randomBytes(4).toString('hex');
    store.set('connector.connectorId', id);
  }
  return id;
}

function deviceInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
  };
}

async function startSocketBridge({ store }) {
  const site = store.get('site') || {};
  const cocon = store.get('cocon') || {};
  const security = store.get('security') || {};
  const connectorId = ensureConnectorId(store);

  const socketBase = (site.socketUrl || 'https://rms-bot.com').replace(/\/$/, '');
  const namespace = site.namespace || '/cocon-connector';
  const topic = site.topic || 'default-topic';
  const roomId = cocon.roomId || 1;

  const url = socketBase + namespace;

  const sock = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 8000,
    auth: {
      token: security.token || '',
      connectorId,
      topic,
      roomId,
    },
  });

  // Create GLOBAL CoconClient instance (shared across all commands)
  // This allows votingPoller to persist between Start and Stop commands
  const { CoconClient } = require('./coconClient');
  const coconClient = new CoconClient({ store, socketClient: { socket: sock } });
  console.log('[socket] ✅ Created global CoconClient instance with VotingPoller');

  // Запуск CoCon Event Listener
  console.log('[socket] ============================================');
  console.log('[socket] Attempting to load CoconEventListener...');
  let eventListener = null;
  try {
    const { CoconEventListener } = require('./coconEventListener');
    console.log('[socket] CoconEventListener class loaded successfully!');
    eventListener = new CoconEventListener({
      store,
      socketClient: { socket: sock }
    });
    console.log('[socket] CoconEventListener instance created!');
  } catch (e) {
    console.log('[socket] ❌ CoconEventListener FAILED:', e.message);
    console.log('[socket] Error stack:', e.stack);
  }
  console.log('[socket] ============================================');

  // Intercept console.log to send logs to server
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog(...args); // Still log locally
    // Send to server if connected
    if (sock && sock.connected) {
      try {
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        sock.emit('connector:log', {
          timestamp: new Date().toISOString(),
          message
        });
      } catch (e) {
        // Ignore errors in log forwarding
      }
    }
  };

  sock.on('connect', async () => {
    try {
      const hello = {
        connectorId,
        topic,
        roomId,
        mmeIp: cocon.mmeIp,
        mmePort: cocon.mmePort,
        roomServerIp: cocon.roomServerIp,
        roomServerSecondaryIp: cocon.roomServerSecondaryIp,
        roomName: cocon.roomName,
        serverVersion: cocon.serverVersion,
        protocolVersion: cocon.protocolVersion,
        device: deviceInfo(),
        capabilities: [
          'CreateAgenda',
          'GetDelegatesOnSeats',
          'EndAgenda',
          'AddQuestionInAgenda',
          'StartVotingInAgenda',
          'SetCurrentQuestionInAgenda',
          'RestartVotingForQuestion',
          'GetAllDelegates',
          'GetVotingAgendaTemplates',
          'DisableMicrophone',
        ],
      };
      sock.emit('connector:hello', hello);

      // Запускаем event listener после успешного подключения
      console.log('[socket] ✅ Socket CONNECTED! EventListener exists:', !!eventListener);
      if (eventListener) {
        console.log('[socket] 🚀 Starting eventListener...');
        eventListener.start();
        console.log('[socket] ✅ EventListener started!');
      } else {
        console.log('[socket] ❌ NO eventListener to start!');
      }

      // Create NEW voting template with IndividualOption=5 to store results
      // This template has the CORRECT settings to save individual votes in CoCon DB
      try {
        const { CoconClient } = require('./coconClient');
        const client = new CoconClient({ store });

        console.log('[socket] Checking for NEW voting template v8 (IndividualOption=5 + OverallOption=1)...');
        const templates = await client.getVotingTemplates();
        // Use v8: IndividualOption=5 (saves votes!) + OverallOption=1 (hides overall counts)
        // Only IndividualOption=5 saves votes - values 2,3,4 don't save!
        const newTemplateName = 'Vote_Store_Results_v8';
        const newTemplateExists = templates.some(t => (t.Title || t.Name) === newTemplateName);

        if (newTemplateExists) {
          console.log(`[socket] ✅ Template "${newTemplateName}" already exists (v8)`);
        } else {
          console.log(`[socket] Creating NEW template "${newTemplateName}" (v8)...`);
          await client.createVotingTemplate({
            title: newTemplateName,
            voteType: 'OPEN',
            duration: 300, // Default 5 minutes (will be overridden per vote)
            canCorrect: true
          });
          console.log(`[socket] ✅ NEW template "${newTemplateName}" created (v8)!`);
          console.log('[socket] 🎉 This template uses IndividualOption=5 (saves!) + OverallOption=1 (hides counts)!');
        }
      } catch (e) {
        console.log('[socket] ⚠️ Could not check/create voting template:', e.message);
      }
    } catch (e) {
      // ignore
    }
  });

  sock.on('disconnect', (reason) => {
    // console.log('[socket] disconnected:', reason);
    // Останавливаем event listener при отключении
    if (eventListener) {
      eventListener.stop();
    }
  });
  sock.on('connect_error', (err) => {
    // console.log('[socket] connect_error:', err.message);
  });

  // Command execution handler (server → connector)
  sock.on('server:command:exec', async (cmd) => {
    const { id, type, payload } = cmd || {};
    try {
      if (id) sock.emit('connector:command:ack', { id });

      const { handleCommand } = require('./commandHandlers');
      const result = await handleCommand({ type, payload, store, coconClient });

      // Special handling for StopVoting: send voting results to server
      // Send both individual votes (if available) and aggregated results
      if (type === 'StopVoting' && result && result.ok) {
        const hasIndividualVotes = result.votes && result.votes.length > 0;
        const hasAggregatedResults = result.aggregated && result.aggregated.totalVotes > 0;

        // Отправляем ВСЕГДА — даже пустые результаты: сервер по ним сразу
        // завершает фазу «Идёт подсчёт голосов» на экране (иначе экран ждёт fallback)
        console.log(`[socket] 📤 Sending voting results to server (votes: ${result.votesCount || 0})...`);
        sock.emit('connector:voting:results', {
          agendaSequence: result.agendaSequence,
          agendaDbId: result.agendaDbId,
          votesCount: result.votesCount || 0,
          votes: result.votes || [],
          aggregated: result.aggregated || null,
          timestamp: new Date().toISOString()
        });

        if (hasIndividualVotes) {
          console.log(`[socket] ✅ Sent ${result.votesCount} individual votes to server`);
        } else if (hasAggregatedResults) {
          console.log(`[socket] ✅ Sent aggregated results: FOR=${result.aggregated.votesFor}, AGAINST=${result.aggregated.votesAgainst}, ABSTAIN=${result.aggregated.votesAbstain}`);
        } else {
          console.log(`[socket] ⚠️ No votes found — sent EMPTY results so the server ends the counting phase`);
        }
      }

      if (id) {
        sock.emit('connector:command:result', { id, ok: true, data: result || null });
      }
    } catch (e) {
      if (id) {
        sock.emit('connector:command:result', { id, ok: false, error: e?.message || String(e) });
      }
    }
  });

  // Expose minimal status in store (for UI via /api/config)
  setInterval(() => {
    store.set('connector.lastSocketStatus', {
      connected: sock.connected,
      id: sock.id,
      ts: Date.now(),
    });
  }, 2000);
}

module.exports = { startSocketBridge };

