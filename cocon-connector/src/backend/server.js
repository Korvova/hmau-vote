const express = require('express');
const cors = require('cors');
const axios = require('axios');
const net = require('net');

function guard(token) {
  return function (req, res, next) {
    if (!token) return next();
    const provided = req.header('X-Auth-Token') || req.query.token;
    if (provided && provided === token) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  };
}

async function startServer({ store, config }) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  const token = config?.security?.token || '';
  const gate = guard(token);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  app.get('/api/config', gate, (req, res) => {
    res.json(store.store);
  });

  app.post('/api/config', gate, (req, res) => {
    const incoming = req.body || {};
    // shallow merge for simplicity
    const updated = { ...store.store, ...incoming };
    store.store = updated;
    res.json({ success: true, config: updated });
  });

  // Emit test command to socket (local debug)
  app.post('/api/commands/emit', gate, async (req, res) => {
    try {
      const { type, payload } = req.body || {};
      if (!type) return res.status(400).json({ error: 'type required' });
      // This endpoint is a placeholder — real emission happens server-side.
      // We just run local handler to simulate execution.
      const { handleCommand } = require('./commandHandlers');
      const result = await handleCommand({ type, payload, store });
      res.json({ ok: true, data: result });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // --- Test endpoints ---
  app.post('/api/test/site-health', gate, async (req, res) => {
    const apiBase = (store.store.site?.apiBase || '').replace(/\/$/, '');
    try {
      const r = await axios.get(`${apiBase}/health`, { timeout: 5000 });
      res.json({ ok: true, status: r.status, data: r.data });
    } catch (e) {
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/test/socket-handshake', gate, async (req, res) => {
    const base = (store.store.site?.socketUrl || '').replace(/\/$/, '');
    try {
      const r = await axios.get(`${base}/socket.io/`, {
        params: { EIO: 4, transport: 'polling' },
        timeout: 5000
      });
      res.json({ ok: true, status: r.status, data: r.data });
    } catch (e) {
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/test/cocon-tcp', gate, async (req, res) => {
    const host = req.body?.host || store.store.cocon?.mmeIp;
    const port = Number(req.body?.port || store.store.cocon?.mmePort || 80);
    const socket = new net.Socket();
    let done = false;
    const finish = (ok, info) => {
      if (done) return; done = true;
      try { socket.destroy(); } catch {}
      if (ok) return res.json({ ok: true, host, port, info });
      return res.status(502).json({ ok: false, host, port, error: info });
    };
    socket.setTimeout(4000);
    socket.on('connect', () => finish(true, 'tcp-connect-ok'));
    socket.on('timeout', () => finish(false, 'timeout'));
    socket.on('error', (err) => finish(false, err.message));
    socket.connect(port, host);
  });

  // --- Placeholder commands ---
  app.post('/api/command/create-delegate', gate, async (req, res) => {
    // TODO: integrate with CoCon SDK/API here
    res.status(501).json({ ok: false, error: 'Not implemented' });
  });

  // ==========================
  // CoCon direct actions (HTTP)
  // ==========================
  const coconBase = () => (store.get('cocon.coConBase') || store.get('cocon').coConBase || 'http://localhost:8890/CoCon').replace(/\/$/, '');
  const mmeBase = () => {
    const c = store.get('cocon');
    const host = c?.mmeIp || '127.0.0.1';
    const port = c?.mmeApiPort || 9012;
    return `http://${host}:${port}`;
  };

  // Central unit IP
  app.get('/api/cocon/cu-ip', gate, async (req, res) => {
    try {
      const url = coconBase() + '/GetCuIpAddress';
      const r = await axios.get(url, { timeout: 5000 });
      res.json({ ok: true, data: r.data });
    } catch (e) {
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  // Simple health for CoCon: reuse CU IP endpoint
  app.get('/api/cocon/health', gate, async (req, res) => {
    try {
      const url = coconBase() + '/GetCuIpAddress';
      const r = await axios.get(url, { timeout: 5000 });
      res.json({ ok: true, cuIp: r.data });
    } catch (e) {
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  // Add synoptic
  app.post('/api/cocon/synoptic', gate, async (req, res) => {
    try {
      const url = coconBase() + '/Room/AddSynoptic';
      const r = await axios.get(url, { timeout: 8000 });
      res.json({ ok: true, data: r.data });
    } catch (e) {
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  // Meetings
  app.get('/api/cocon/meetings', gate, async (req, res) => {
    try {
      const url = coconBase() + '/Meeting_Agenda/GetAllMeetings';
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Delegates
  app.get('/api/cocon/delegates', gate, async (req, res) => {
    try {
      const url = coconBase() + '/Delegate/GetAllDelegates';
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  app.post('/api/cocon/delegate/add', gate, async (req, res) => {
    try {
      const { Name, FirstName, VotingRight=true, VotingWeight=1, BadgeNr } = req.body || {};
      if (!Name) return res.status(400).json({ error: 'Name required' });
      const params = new URLSearchParams({
        Name: String(Name),
        FirstName: FirstName ? String(FirstName) : '',
        VotingRight: String(!!VotingRight),
        VotingWeight: String(Number(VotingWeight || 1)),
        BadgeNr: BadgeNr ? String(BadgeNr) : ''
      });
      const url = coconBase() + '/Delegate/AddDelegate/?' + params.toString();
      const r = await axios.get(url, { timeout: 8000 });
      res.json({ ok: true, result: r.data });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Voting templates
  app.get('/api/cocon/voting/templates', gate, async (req, res) => {
    try {
      const url = coconBase() + '/Meeting_Agenda/GetVotingAgendaTemplateList';
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Start empty meeting
  app.post('/api/cocon/meeting/start-empty', gate, async (req, res) => {
    try {
      const { Title='Auto', From, To, LoginMethod=0, AuthenticationMode=0, AuthenticationType=0 } = req.body || {};
      const from = From || new Date().toISOString().slice(0,19);
      const to = To || new Date(Date.now()+60*60*1000).toISOString().slice(0,19);
      const enc = (s) => encodeURIComponent(s);
      const url = coconBase() + `/Meeting_Agenda/StartEmptyMeeting/?Title=${enc(Title)}&From=${enc(from)}&To=${enc(to)}&LoginMethod=${LoginMethod}&AuthenticationMode=${AuthenticationMode}&AuthenticationType=${AuthenticationType}`;
      const r = await axios.get(url, { timeout: 10000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Instant vote by template
  app.post('/api/cocon/voting/instant', gate, async (req, res) => {
    try {
      const { VotingTemplate } = req.body || {};
      if (!VotingTemplate) return res.status(400).json({ error: 'VotingTemplate required' });
      const url = coconBase() + `/Voting/AddInstantVote/?VotingTemplate=${encodeURIComponent(VotingTemplate)}`;
      const r = await axios.get(url, { timeout: 10000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Voting state
  app.post('/api/cocon/voting/state', gate, async (req, res) => {
    try {
      const { State } = req.body || {};
      if (!State) return res.status(400).json({ error: 'State required (Open/Closed/..)' });
      const url = coconBase() + `/Voting/SetVotingState/?State=${encodeURIComponent(State)}`;
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Agenda info in running meeting
  app.get('/api/cocon/agenda/current', gate, async (req, res) => {
    try {
      const url = coconBase() + '/Meeting_Agenda/GetAgendaItemInformationInRunningMeeting';
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Add delegates to meeting
  app.post('/api/cocon/meeting/add-delegates', gate, async (req, res) => {
    try {
      const { DelegatesId, MeetingId } = req.body || {};
      if (!DelegatesId || !MeetingId) return res.status(400).json({ error: 'DelegatesId and MeetingId required' });
      const url = coconBase() + `/Meeting_Agenda/AddDelegatesToMeeting/?DelegatesId=${encodeURIComponent(DelegatesId)}&MeetingId=${encodeURIComponent(MeetingId)}`;
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // MME devices
  app.get('/api/mme/devices', gate, async (req, res) => {
    try {
      const url = mmeBase() + '/api/v1/diagnostics/devices';
      const r = await axios.get(url, { timeout: 8000 });
      res.json(r.data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // MME health: try list devices
  app.get('/api/mme/health', gate, async (req, res) => {
    try {
      const url = mmeBase() + '/api/v1/diagnostics/devices';
      const r = await axios.get(url, { timeout: 5000 });
      res.json({ ok: true, count: Array.isArray(r.data) ? r.data.length : undefined });
    } catch (e) {
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  // Combined connectivity status (socket + CoCon + MME)
  app.get('/api/health/connectivity', async (req, res) => {
    const socket = store.get('connector.lastSocketStatus') || { connected: false };
    try {
      const [cocon, mme] = await Promise.allSettled([
        axios.get(coconBase() + '/GetCuIpAddress', { timeout: 5000 }),
        axios.get(mmeBase() + '/api/v1/diagnostics/devices', { timeout: 5000 })
      ]);
      res.json({
        socket,
        cocon: cocon.status === 'fulfilled' ? { ok: true, cuIp: cocon.value.data } : { ok: false, error: cocon.reason?.message },
        mme: mme.status === 'fulfilled' ? { ok: true, devices: Array.isArray(mme.value.data) ? mme.value.data.length : undefined } : { ok: false, error: mme.reason?.message }
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stop currently running meeting (best-effort)
  app.post('/api/cocon/meeting/stop-running', gate, async (req, res) => {
    try {
      const c = store.get('cocon') || {};
      const base = (c.coConBase || 'http://localhost:8890/CoCon').replace(/\/$/, '');
      const getMeetings = async () => {
        const r = await axios.get(base + '/Meeting_Agenda/GetAllMeetings', { timeout: 8000 });
        const raw = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        return raw?.GetAllMeetings?.Meetings || [];
      };
      let meetings = await getMeetings();
      let running = meetings.find(m => String(m.State).toLowerCase() === 'running');
      if (!running) return res.json({ ok:true, message: 'No running meeting' });
      const qId = `?MeetingId=${encodeURIComponent(running.Id)}`;
      const tryCalls = async (paths) => { for (const p of paths) { try { await axios.get(base + p, { timeout: 8000 }); } catch {} } };
      await tryCalls([
        '/Meeting_Agenda/EndActiveMeeting',
        '/Voting/SetVotingState/?State=Closed',
        `/Meeting_Agenda/EndMeeting${qId}`,
        `/Meeting_Agenda/StopMeeting${qId}`,
        `/Meeting_Agenda/EndAgenda${qId}`
      ]);
      meetings = await getMeetings();
      running = meetings.find(m => String(m.State).toLowerCase() === 'running');
      if (running) return res.status(409).json({ ok:false, error:'Still running', meetingId: running.Id });
      res.json({ ok:true });
    } catch (e) {
      res.status(500).json({ ok:false, error: e.message });
    }
  });

  // Quick test: start meeting if not running, add all delegates, optionally open instant vote
  app.post('/api/cocon/test/start-run', gate, async (req, res) => {
    try {
      const { template, stopIfRunning } = req.body || {};
      const c = store.get('cocon') || {};
      const base = (c.coConBase || 'http://localhost:8890/CoCon').replace(/\/$/, '');

      // Get or start meeting
      const getMeetings = async () => {
        const r = await axios.get(base + '/Meeting_Agenda/GetAllMeetings', { timeout: 8000 });
        const raw = typeof r.data === 'string' ? (JSON.parse(r.data)) : r.data;
        return raw?.GetAllMeetings?.Meetings || [];
      };
      let meetings = await getMeetings();
      let running = meetings.find(m => String(m.State).toLowerCase() === 'running');
      if (!running) {
        const now = new Date();
        const from = encodeURIComponent(now.toISOString().slice(0,19));
        const to = encodeURIComponent(new Date(now.getTime()+60*60*1000).toISOString().slice(0,19));
        const title = encodeURIComponent('Auto');
        const loginMethod = Number(c.loginMethod ?? 0);
        await axios.get(`${base}/Meeting_Agenda/StartEmptyMeeting/?Title=${title}&From=${from}&To=${to}&LoginMethod=${loginMethod}&AuthenticationMode=0&AuthenticationType=0`, { timeout: 10000 });
        meetings = await getMeetings();
        running = meetings.find(m => String(m.State).toLowerCase() === 'running');
      } else {
        if (!stopIfRunning) {
          return res.status(409).json({ ok:false, error:'Meeting already running', meetingId: running.Id });
        }
        // Try to stop running meeting gracefully
        const tryCalls = async (paths) => {
          for (const p of paths) {
            try { await axios.get(base + p, { timeout: 8000 }); } catch {}
          }
        };
        const qId = `?MeetingId=${encodeURIComponent(running.Id)}`;
        await tryCalls([
          '/Meeting_Agenda/EndActiveMeeting',
          '/Voting/SetVotingState/?State=Closed',
          `/Meeting_Agenda/EndMeeting${qId}`,
          `/Meeting_Agenda/StopMeeting${qId}`,
          `/Meeting_Agenda/EndAgenda${qId}`
        ]);
        // re-check and if still running, return conflict
        meetings = await getMeetings();
        running = meetings.find(m => String(m.State).toLowerCase() === 'running');
        if (running) return res.status(409).json({ ok:false, error:'Unable to stop running meeting', meetingId: running.Id });
        // start new now
        const now2 = new Date();
        const from2 = encodeURIComponent(now2.toISOString().slice(0,19));
        const to2 = encodeURIComponent(new Date(now2.getTime()+60*60*1000).toISOString().slice(0,19));
        const title2 = encodeURIComponent('Auto');
        await axios.get(`${base}/Meeting_Agenda/StartEmptyMeeting/?Title=${title2}&From=${from2}&To=${to2}&LoginMethod=0&AuthenticationMode=0&AuthenticationType=0`, { timeout: 10000 });
        meetings = await getMeetings();
        running = meetings.find(m => String(m.State).toLowerCase() === 'running');
      }
      if (!running) return res.status(500).json({ ok:false, error:'No running meeting after start' });

      // Delegates
      const delsResp = await axios.get(base + '/Delegate/GetAllDelegates', { timeout: 8000 });
      const delsRaw = typeof delsResp.data === 'string' ? JSON.parse(delsResp.data) : delsResp.data;
      let dels = (delsRaw?.GetAllDelegates?.Delegates || []).map(d => d.Id).filter(Boolean);
      const maxSeats = Number(c.maxSeats ?? 0);
      if (maxSeats > 0 && dels.length > maxSeats) {
        dels = dels.slice(0, maxSeats);
      }
      if (dels.length) {
        const ids = encodeURIComponent(dels.join(','));
        await axios.get(`${base}/Meeting_Agenda/AddDelegatesToMeeting/?DelegatesId=${ids}&MeetingId=${encodeURIComponent(running.Id)}`, { timeout: 12000 });
      }

      // Optional instant vote
      if (template) {
        await axios.get(`${base}/Voting/AddInstantVote/?VotingTemplate=${encodeURIComponent(template)}`, { timeout: 8000 });
        await axios.get(`${base}/Voting/SetVotingState/?State=Open`, { timeout: 8000 });
      }

      res.json({ ok:true, meetingId: running.Id, delegates: dels.length, voteTemplate: template || null });
    } catch (e) {
      res.status(500).json({ ok:false, error: e.message });
    }
  });

  // Device highlight on/off
  app.put('/api/mme/devices/:id/highlight', gate, async (req, res) => {
    try {
      const id = req.params.id;
      const { ledColor='Red', ledState='On' } = req.body || {};
      const url = mmeBase() + `/api/v1/diagnostics/devices/${encodeURIComponent(id)}/highlightstate`;
      const r = await axios.put(url, { ledColor, ledState }, { timeout: 8000, headers: { 'Content-Type': 'application/json' } });
      res.json(r.data || { ok: true });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });

  // Test voting: get templates and try to start voting
  app.post('/api/cocon/voting/test-start', gate, async (req, res) => {
    const logs = [];
    const log = (msg) => {
      console.log(`[VotingTest] ${msg}`);
      logs.push(msg);
    };

    try {
      const base = coconBase();
      log(`Using CoCon base: ${base}`);

      // 1. Get voting templates
      log('Fetching voting templates...');
      const templatesUrl = `${base}/Meeting_Agenda/GetVotingAgendaTemplateList`;
      const templatesResp = await axios.get(templatesUrl, { timeout: 10000 });
      const templatesRaw = typeof templatesResp.data === 'string' ? JSON.parse(templatesResp.data) : templatesResp.data;
      const templates = templatesRaw?.GetVotingAgendaTemplateList?.AgendaItems || [];
      log(`Found ${templates.length} templates`);

      const templateNames = templates.map(t => t.Title || t.Name).filter(Boolean);
      log(`Template names: ${templateNames.join(', ')}`);

      // 2. Get current voting state
      log('Checking current voting state...');
      const stateUrl = `${base}/Voting/GetVotingState`;
      const stateResp = await axios.get(stateUrl, { timeout: 8000 });
      const stateRaw = typeof stateResp.data === 'string' ? JSON.parse(stateResp.data) : stateResp.data;
      const currentState = stateRaw?.GetVotingState?.State || 'Unknown';
      log(`Current state: ${currentState}`);

      // 3. If there are templates, try AddInstantVote with first one
      if (templateNames.length > 0) {
        const templateName = templateNames[0];
        log(`Trying AddInstantVote with template: ${templateName}...`);
        const instantUrl = `${base}/Voting/AddInstantVote/?VotingTemplate=${encodeURIComponent(templateName)}`;
        const instantResp = await axios.get(instantUrl, { timeout: 10000 });
        const instantRaw = typeof instantResp.data === 'string' ? JSON.parse(instantResp.data) : instantResp.data;
        log(`AddInstantVote response: ${JSON.stringify(instantRaw)}`);

        const result = instantRaw?.AddInstantVote?.Result;
        if (result === true) {
          log('✓ SUCCESS! Voting started with AddInstantVote');
          return res.json({ ok: true, method: 'AddInstantVote', template: templateName, logs });
        } else {
          log(`AddInstantVote returned false, trying Start command...`);
        }
      }

      // 4. Try Start command
      log('Trying Start command...');
      const startUrl = `${base}/Voting/SetVotingState/?State=Start`;
      const startResp = await axios.get(startUrl, { timeout: 8000 });
      const startResult = typeof startResp.data === 'string' ? startResp.data : JSON.stringify(startResp.data);
      log(`Start result: ${startResult}`);

      if (startResult === '0') {
        log('✓ SUCCESS! Voting started with Start command');
        return res.json({ ok: true, method: 'Start', logs });
      }

      // 5. Try Restart command
      log('Start failed, trying Restart...');
      const restartUrl = `${base}/Voting/SetVotingState/?State=Restart`;
      const restartResp = await axios.get(restartUrl, { timeout: 8000 });
      const restartResult = typeof restartResp.data === 'string' ? restartResp.data : JSON.stringify(restartResp.data);
      log(`Restart result: ${restartResult}`);

      if (restartResult === '0') {
        log('✓ SUCCESS! Voting started with Restart command');
        return res.json({ ok: true, method: 'Restart', logs });
      }

      log('❌ All methods failed');
      res.status(400).json({ ok: false, error: 'All methods failed', currentState, templates: templateNames, logs });

    } catch (e) {
      log(`ERROR: ${e.message}`);
      res.status(500).json({ ok: false, error: e.message, logs });
    }
  });

  const host = store.store.listener?.host || '0.0.0.0';
  const port = Number(store.store.listener?.port || 4000);

  return new Promise((resolve) => {
    app.listen(port, host, () => {
      console.log(`[connector] Listening on http://${host}:${port}`);
      resolve();
    });
  });
}

module.exports = { startServer };
