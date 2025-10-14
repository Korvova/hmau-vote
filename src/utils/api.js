function resolveUrl(path) {
  try {
    if (path.startsWith('/')) {
      // 1) Explicit base from env (Vite). Expected to be an origin, like "http://localhost:5000".
      try {
        const base = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE;
        if (typeof base === 'string' && base.trim()) {
          const trimmed = base.replace(/\/$/, '');
          return `${trimmed}${path}`;
        }
      } catch {}

      return path;
    }
  } catch {}
  return path;
}

export async function apiRequest(path, options = {}) {
  const url = resolveUrl(path);
  const hasBody = options && Object.prototype.hasOwnProperty.call(options, 'body');
  const defaultHeaders = hasBody ? { 'Content-Type': 'application/json' } : {};
  const res = await fetch(url, {
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const message = data?.error || data?.message || res.statusText || 'Request failed';
    const error = new Error(message);
    error.data = data; // Сохраняем данные ответа в ошибке
    throw error;
  }
  return data;
}

// Divisions
export const getDivisions = () => apiRequest('/api/divisions');
export const createDivision = (payload) => apiRequest('/api/divisions', { method: 'POST', body: JSON.stringify(payload) });
export const updateDivision = (id, payload) => apiRequest(`/api/divisions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteDivision = (id) => apiRequest(`/api/divisions/${id}`, { method: 'DELETE' });

// Users
export const getUsers = () => apiRequest('/api/users');
export const createUser = (payload) => apiRequest('/api/users', { method: 'POST', body: JSON.stringify(payload) });
export const updateUser = (id, payload) => apiRequest(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteUser = (id) => apiRequest(`/api/users/${id}`, { method: 'DELETE' });
export const disconnectUser = (id) => apiRequest(`/api/users/${id}/disconnect`, { method: 'POST' });

// Meetings
export const getMeetings = () => apiRequest('/api/meetings');
export const getArchivedMeetings = () => apiRequest('/api/meetings/archived');
export const getMeeting = (id) => apiRequest(`/api/meetings/${id}`);
export const getAgendaItems = (meetingId) => apiRequest(`/api/meetings/${meetingId}/agenda-items`);
export const startAgendaItem = (meetingId, agendaId) =>
  apiRequest(`/api/meetings/${meetingId}/agenda-items/${agendaId}/start`, { method: 'POST' });
export const createMeeting = (payload) => apiRequest('/api/meetings', { method: 'POST', body: JSON.stringify(payload) });
export const updateMeeting = (id, payload) => apiRequest(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteMeeting = (id) => apiRequest(`/api/meetings/${id}`, { method: 'DELETE' });
export const archiveMeeting = (id) => apiRequest(`/api/meetings/${id}/archive`, { method: 'POST' });
export const getMeetingParticipants = (id) => apiRequest(`/api/meetings/${id}/participants`);
export const saveMeetingParticipants = (id, participants) => apiRequest(`/api/meetings/${id}/participants/save`, { method: 'POST', body: JSON.stringify({ participants }) });
export const getVoteWeight = (meetingId, userId) => apiRequest(`/api/meetings/${meetingId}/vote-weight/${userId}`);
export const saveMeetingScreenConfig = (id, screenConfig) => apiRequest(`/api/meetings/${id}/screen-config`, { method: 'PUT', body: JSON.stringify({ screenConfig }) });
export const getMeetingScreenConfig = (id) => apiRequest(`/api/meetings/${id}/screen-config`);

// Vote results
export const getVoteResults = (meetingId) => apiRequest(`/api/vote-results?meetingId=${encodeURIComponent(meetingId)}`);

export const submitVote = ({ userId, agendaItemId, choice }) =>
  apiRequest('/api/vote', {
    method: 'POST',
    body: JSON.stringify({ userId, agendaItemId, choice }),
  });

export const submitVoteByResult = ({ userId, voteResultId, choice }) =>
  apiRequest('/api/vote-by-result', {
    method: 'POST',
    body: JSON.stringify({ userId, voteResultId, choice }),
  });

export const getActiveVoteResult = async (meetingId) => {
  if (!meetingId) return null;
  const results = await getVoteResults(meetingId);
  if (!Array.isArray(results)) return null;
  return results.find((result) => result?.voteStatus === 'PENDING') || null;
};


// Vote templates
export const getVoteTemplates = () => apiRequest('/api/vote-templates');
export const createVoteTemplate = (payload) => apiRequest('/api/vote-templates', { method: 'POST', body: JSON.stringify(payload) });
export const updateVoteTemplate = (id, payload) => apiRequest(`/api/vote-templates/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteVoteTemplate = (id) => apiRequest(`/api/vote-templates/${id}`, { method: 'DELETE' });

// Vote procedures
export const getVoteProcedures = () => apiRequest('/api/vote-procedures');
export const getVoteProcedure = (id) => apiRequest(`/api/vote-procedures/${id}`);
export const createVoteProcedure = (payload) => apiRequest('/api/vote-procedures', { method: 'POST', body: JSON.stringify(payload) });
export const updateVoteProcedure = (id, payload) => apiRequest(`/api/vote-procedures/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteVoteProcedure = (id) => apiRequest(`/api/vote-procedures/${id}`, { method: 'DELETE' });

// Duration templates
export const getDurationTemplates = () => apiRequest('/api/duration-templates');
export const getDurationTemplate = (id) => apiRequest(`/api/duration-templates/${id}`);
export const createDurationTemplate = (payload) => apiRequest('/api/duration-templates', { method: 'POST', body: JSON.stringify(payload) });
export const updateDurationTemplate = (id, payload) => apiRequest(`/api/duration-templates/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteDurationTemplate = (id) => apiRequest(`/api/duration-templates/${id}`, { method: 'DELETE' });
// Start vote
export const startVote = (payload) =>
  apiRequest('/api/start-vote', { method: 'POST', body: JSON.stringify(payload) });
// End vote
export const endVote = (agendaItemId) =>
  apiRequest(`/api/vote-results/${agendaItemId}/end`, { method: 'POST' });
// Auth
export const login = (username, password) =>
  apiRequest('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout = (username, email) =>
  apiRequest('/api/logout', { method: 'POST', body: JSON.stringify({ username, email }) });
