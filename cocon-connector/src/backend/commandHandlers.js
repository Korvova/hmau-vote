// Command handlers for CoConAgenda API (stubs for now)
// Map server command types to functions here.

const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function CreateAgenda({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.createAgenda(payload);
}
async function GetDelegatesOnSeats({ store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  const list = await client.getDelegatesOnSeats();
  return list;
}
async function EndAgenda({ store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.endAgenda();
}
async function AddQuestionInAgenda({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  const id = await client.addQuestionInAgenda(payload);
  return { id };
}
async function StartVotingInAgenda({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.startVotingInAgenda(payload);
}
async function SetCurrentQuestionInAgenda({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  await client.setCurrentQuestionInAgenda(payload?.number || payload?.id);
  return 'OK';
}
async function RestartVotingForQuestion({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.restartVotingForQuestion(payload?.number || payload?.id);
}
async function GetAllDelegates({ store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  const list = await client.getAllDelegates();
  // normalize to {id,name}
  return (list || []).map(d => ({
    id: d.Id ?? d.id ?? d.externalId ?? d.SdegId ?? d.DelegateId ?? d.guid ?? d.Guid ?? d.ID ?? String(d.Name || d.name || d.displayName || d.fullName || ''),
    name: `${d.FirstName || d.firstName || ''} ${d.Name || d.name || ''}`.trim() || d.displayName || d.fullName || ''
  }));
}
async function GetVotingAgendaTemplates({ store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  const list = await client.getVotingTemplates();
  return list;
}
async function DisableMicrophone({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.disableMicrophone(payload?.userId || payload?.delegateId);
}
async function StartVotingWithTemplate({ payload, store, coconClient }) {
  // Use global coconClient if provided (preserves votingPoller between calls)
  // Otherwise create new instance (fallback for old code paths)
  if (coconClient) {
    return await coconClient.startVotingWithTemplate(payload);
  }
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.startVotingWithTemplate(payload);
}
async function StopVoting({ store, coconClient }) {
  // Use global coconClient if provided (preserves votingPoller between calls)
  // Otherwise create new instance (fallback for old code paths)
  if (coconClient) {
    return await coconClient.stopVoting();
  }
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.stopVoting();
}
async function CreateVotingTemplate({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  return await client.createVotingTemplate(payload || {
    title: '3_Vote_Correctable',
    voteType: 'OPEN',
    duration: 180,
    canCorrect: true
  });
}

// TEST: Get individual voting results for testing
async function GetVotingResults({ payload, store }) {
  const { CoconClient } = require('./coconClient');
  const client = new CoconClient({ store });
  const agendaId = payload?.agendaId || payload?.id;
  if (!agendaId) throw new Error('agendaId required');
  console.log(`[GetVotingResults] Getting results for agenda ${agendaId}`);
  const results = await client.getIndividualVotingResults(agendaId);
  console.log(`[GetVotingResults] Got ${results.length} votes:`, JSON.stringify(results, null, 2));
  return { agendaId, votes: results, count: results.length };
}

// Generic HTTP executor on the connector (to call local CoCon/MME endpoints)
async function ConnectorHttp({ payload, store }) {
  const method = String(payload?.method || 'GET').toUpperCase();
  const raw = payload?.url || payload?.path;
  if (!raw) throw new Error('url or path required');

  // Bases
  const cfg = store.get('cocon') || {};
  const coConBase = (cfg.coConBase || 'http://localhost:8890/CoCon').replace(/\/$/, '');
  const mmeBase = `http://${cfg.mmeIp || '127.0.0.1'}:${cfg.mmeApiPort || 9012}`;

  const isAbs = /^https?:\/\//i.test(raw);
  let finalUrl;
  if (isAbs) {
    finalUrl = raw;
  } else if (/^\/?api\/v1\//i.test(raw)) {
    // MME API
    finalUrl = mmeBase + (raw.startsWith('/') ? raw : '/' + raw);
  } else {
    // CoCon API; allow both with or without /CoCon prefix
    let rel = raw;
    if (rel.startsWith('/CoCon/')) rel = rel.replace(/^\/CoCon/, '');
    if (!rel.startsWith('/')) rel = '/' + rel;
    finalUrl = coConBase + rel;
  }

  // Attach query
  if (payload?.query && typeof payload.query === 'object') {
    const u = new URL(finalUrl);
    for (const [k, v] of Object.entries(payload.query)) {
      if (v !== undefined && v !== null) u.searchParams.set(String(k), String(v));
    }
    finalUrl = u.toString();
  }

  const timeout = Number(payload?.timeoutMs || 10000);
  const headers = payload?.headers && typeof payload.headers === 'object' ? payload.headers : undefined;
  const data = payload?.body !== undefined ? payload.body : undefined;

  try {
    const r = await axios({ method, url: finalUrl, headers, data, timeout });
    return { status: r.status, data: r.data };
  } catch (e) {
    const resp = e.response;
    if (resp) {
      return { status: resp.status, data: resp.data, error: e.message };
    }
    throw e;
  }
}

// Safe remote file write (requires matching security.token on connector)
async function WriteFiles({ payload, store }) {
  const expected = (store.get('security.token') || (store.get('security') || {}).token || '').trim();
  const provided = (payload?.token || '').trim();
  if (expected && expected.length > 0 && expected !== provided) {
    throw new Error('Unauthorized: bad token');
  }
  const files = Array.isArray(payload?.files) ? payload.files : [];
  if (!files.length) throw new Error('files array required');
  const base = process.cwd();
  const results = [];
  for (const f of files) {
    const p = String(f.path || '');
    if (!p) throw new Error('file path required');
    const dest = path.resolve(base, p);
    if (!dest.startsWith(base)) throw new Error('path out of project');
    const dir = path.dirname(dest);
    if (f.mkdirs) fs.mkdirSync(dir, { recursive: true });
    const content = f.content !== undefined ? String(f.content) : '';
    if (f.append) {
      fs.appendFileSync(dest, content, 'utf8');
    } else {
      fs.writeFileSync(dest, content, 'utf8');
    }
    results.push({ path: p, bytes: Buffer.byteLength(content, 'utf8'), append: !!f.append });
  }
  return { ok: true, written: results.length, results };
}

const map = {
  CreateAgenda,
  GetDelegatesOnSeats,
  EndAgenda,
  AddQuestionInAgenda,
  StartVotingInAgenda,
  SetCurrentQuestionInAgenda,
  RestartVotingForQuestion,
  GetAllDelegates,
  GetVotingAgendaTemplates,
  DisableMicrophone,
  StartVotingWithTemplate,
  StopVoting,
  CreateVotingTemplate,
  GetVotingResults,
  ConnectorHttp,
  WriteFiles,
};

async function handleCommand({ type, payload, store, coconClient }) {
  const fn = map[type];
  if (!fn) throw new Error('Unknown command type: ' + type);
  return await fn({ payload, store, coconClient });
}

module.exports = { handleCommand };
