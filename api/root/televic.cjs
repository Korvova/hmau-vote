const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (_, __, io) => {
const router = express.Router();

// List linked users (userId, email, name, televicExternalId)
router.get('/links', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, televicExternalId: true },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Link user to Televic delegate externalId
router.post('/link', async (req, res) => {
  try {
    const { userId, externalId } = req.body || {};
    if (!userId || !externalId) return res.status(400).json({ error: 'userId and externalId are required' });
    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data: { televicExternalId: String(externalId) },
      select: { id: true, email: true, name: true, televicExternalId: true }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unlink user
router.delete('/link/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { televicExternalId: null },
      select: { id: true, email: true, name: true, televicExternalId: true }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Toggle microphone for delegate
router.post('/microphone/toggle', async (req, res) => {
  try {
    console.log('[Microphone Toggle] Request body:', req.body);
    const { userId, action } = req.body; // action: 'enable' | 'disable'
    if (!userId) {
      console.log('[Microphone Toggle] ERROR: userId required');
      return res.status(400).json({ error: 'userId required' });
    }
    if (!action || !['enable', 'disable'].includes(action)) {
      console.log('[Microphone Toggle] ERROR: action must be enable or disable, got:', action);
      return res.status(400).json({ error: 'action must be "enable" or "disable"' });
    }
    console.log('[Microphone Toggle] userId:', userId, 'action:', action);

    // Find user's televicExternalId
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { televicExternalId: true, name: true }
    });

    if (!user?.televicExternalId) {
      console.log('[Microphone Toggle] ERROR: User not linked to Televic, user:', user);
      return res.status(400).json({ error: 'User not linked to Televic delegate' });
    }
    console.log('[Microphone Toggle] User found:', user.name, 'televicExternalId:', user.televicExternalId);

    if (!io) return res.status(500).json({ error: 'Socket.IO not available' });

    // Find connector socket
    const coconNS = io.of('/cocon-connector');
    let socket = null;
    for (const [sid, sock] of coconNS.sockets) {
      socket = sock;
      break;
    }

    if (!socket) {
      return res.status(503).json({ error: 'No connector online' });
    }

    // Send command to get running meeting and delegate seating
    const commandId = require('crypto').randomUUID();

    // First, get running meeting ID
    const getMeetingResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('connector:command:result', handler);
        reject(new Error('Timeout waiting for meeting info'));
      }, 10000);

      const handler = (msg) => {
        if (msg && msg.id === commandId) {
          clearTimeout(timeout);
          socket.off('connector:command:result', handler);
          resolve(msg);
        }
      };

      socket.on('connector:command:result', handler);
      socket.emit('server:command:exec', {
        id: commandId,
        type: 'ConnectorHttp',
        payload: {
          method: 'GET',
          url: '/Meeting_Agenda/GetAllMeetings'
        }
      });
    });

    if (!getMeetingResult.ok || !getMeetingResult.data) {
      return res.status(500).json({ error: 'Failed to get meetings' });
    }

    const meetingsData = getMeetingResult.data.data;
    const parsed = typeof meetingsData === 'string' ? JSON.parse(meetingsData) : meetingsData;
    const meetings = parsed?.GetAllMeetings?.Meetings || [];
    const runningMeeting = meetings.find(m => String(m.State).toLowerCase() === 'running');

    if (!runningMeeting) {
      console.log('[Microphone Toggle] ERROR: No running meeting, meetings:', meetings.map(m => ({ id: m.Id, title: m.Title, state: m.State })));
      return res.status(400).json({ error: 'No running meeting in CoCon' });
    }
    console.log('[Microphone Toggle] Running meeting found:', runningMeeting.Id, runningMeeting.Title);

    // Get delegate seating
    const seatingId = require('crypto').randomUUID();
    const seatingResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('connector:command:result', handler);
        reject(new Error('Timeout waiting for seating info'));
      }, 10000);

      const handler = (msg) => {
        if (msg && msg.id === seatingId) {
          clearTimeout(timeout);
          socket.off('connector:command:result', handler);
          resolve(msg);
        }
      };

      socket.on('connector:command:result', handler);
      socket.emit('server:command:exec', {
        id: seatingId,
        type: 'ConnectorHttp',
        payload: {
          method: 'GET',
          url: `/Meeting_Agenda/GetDelegateSeating`,
          query: { MeetingId: runningMeeting.Id }
        }
      });
    });

    if (!seatingResult.ok || !seatingResult.data) {
      return res.status(500).json({ error: 'Failed to get delegate seating' });
    }

    const seatingData = seatingResult.data.data;
    const seatingParsed = typeof seatingData === 'string' ? JSON.parse(seatingData) : seatingData;
    const seats = seatingParsed?.GetDelegateSeating?.DelegateSeating || [];
    const delegateSeat = seats.find(d => String(d.DelegateId) === String(user.televicExternalId));

    if (!delegateSeat) {
      console.log('[Microphone Toggle] ERROR: Delegate not in seating, seats:', seats.map(s => ({ delegateId: s.DelegateId, seatId: s.SeatId })));
      return res.status(400).json({ error: 'Delegate not in seating for this meeting' });
    }
    console.log('[Microphone Toggle] Delegate seat found:', delegateSeat.SeatId);

    // Toggle microphone using SetState API
    const state = action === 'enable' ? 'On' : 'Off';
    const micId = require('crypto').randomUUID();

    const micResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('connector:command:result', handler);
        reject(new Error('Timeout waiting for microphone action'));
      }, 10000);

      const handler = (msg) => {
        if (msg && msg.id === micId) {
          clearTimeout(timeout);
          socket.off('connector:command:result', handler);
          resolve(msg);
        }
      };

      socket.on('connector:command:result', handler);
      socket.emit('server:command:exec', {
        id: micId,
        type: 'ConnectorHttp',
        payload: {
          method: 'GET',
          url: '/Microphone/SetState',
          query: { State: state, SeatNr: delegateSeat.SeatId }
        }
      });
    });

    if (!micResult.ok) {
      console.log('[Microphone Toggle] ERROR: Failed to toggle microphone:', micResult.error);
      return res.status(500).json({ error: 'Failed to toggle microphone', details: micResult.error });
    }

    console.log('[Microphone Toggle] SUCCESS: Microphone toggled', action, 'for user', user.name);
    res.json({
      ok: true,
      action,
      user: user.name,
      seatId: delegateSeat.SeatId
    });
  } catch (e) {
    console.log('[Microphone Toggle] EXCEPTION:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Test: Write file to connector PC
router.post('/test-write-file', async (req, res) => {
  try {
    if (!io) return res.status(500).json({ error: 'Socket.IO not available' });

    // Find connector socket
    const coconNS = io.of('/cocon-connector');
    let socket = null;
    for (const [sid, sock] of coconNS.sockets) {
      socket = sock;
      break;
    }

    if (!socket) {
      return res.status(503).json({ error: 'No connector online' });
    }

    // Send WriteFiles command
    const commandId = require('crypto').randomUUID();
    const testContent = `# Test File\n\nThis is a test file created at ${new Date().toISOString()}\n\nToken test: ${req.body.token || 'no token'}\n`;

    const payload = {
      token: req.body.token || '',
      files: [
        {
          path: 'test-remote-write.txt',
          content: testContent,
          mkdirs: false,
          append: false
        }
      ]
    };

    // Wait for result
    const resultPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('connector:command:result', handler);
        reject(new Error('Timeout waiting for response'));
      }, 10000);

      const handler = (msg) => {
        if (msg && msg.id === commandId) {
          clearTimeout(timeout);
          socket.off('connector:command:result', handler);
          resolve(msg);
        }
      };

      socket.on('connector:command:result', handler);
    });

    socket.emit('server:command:exec', {
      id: commandId,
      type: 'WriteFiles',
      payload
    });

    const result = await resultPromise;
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create meeting in Televic CoCon (mirror from website)
router.post('/meeting/create', async (req, res) => {
  try {
    const { meetingId, title, startTime, delegates } = req.body;
    if (!meetingId || !title) {
      return res.status(400).json({ error: 'meetingId and title are required' });
    }

    if (!io) return res.status(500).json({ error: 'Socket.IO not available' });

    // Find connector socket
    const coconNS = io.of('/cocon-connector');
    let socket = null;
    for (const [sid, sock] of coconNS.sockets) {
      socket = sock;
      break;
    }

    if (!socket) {
      return res.status(503).json({ error: 'No connector online' });
    }

    // Helper function to send command
    const sendCommand = async (url, query = {}) => {
      const commandId = require('crypto').randomUUID();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.off('connector:command:result', handler);
          reject(new Error(`Timeout: ${url}`));
        }, 15000);

        const handler = (msg) => {
          if (msg && msg.id === commandId) {
            clearTimeout(timeout);
            socket.off('connector:command:result', handler);
            resolve(msg);
          }
        };

        socket.on('connector:command:result', handler);
        socket.emit('server:command:exec', {
          id: commandId,
          type: 'ConnectorHttp',
          payload: { method: 'GET', url, query }
        });
      });
    };

    // Step 1: Create empty meeting with LoginMethod=2 (free seating, must authenticate)
    console.log('[Televic] Creating meeting:', title);
    const createResult = await sendCommand('/Meeting_Agenda/StartEmptyMeeting', {
      Title: title,
      Description: `Mirror from site (ID: ${meetingId})`,
      LoginMethod: 2, // Free seating, delegates must authenticate
      AuthenticationMode: 0, // Internal authentication
      AuthenticationType: 1  // Badge only (можно изменить на 3 для badge+fingerprint)
    });

    if (!createResult.ok || !createResult.data) {
      return res.status(500).json({ error: 'Failed to create meeting in Televic' });
    }

    const meetingData = createResult.data.data;
    const parsed = typeof meetingData === 'string' ? JSON.parse(meetingData) : meetingData;
    const televicMeetingId = parsed?.StartEmptyMeeting?.MeetingId || null;

    if (!televicMeetingId) {
      return res.status(500).json({ error: 'No MeetingId returned from Televic' });
    }

    console.log('[Televic] Created meeting ID:', televicMeetingId);

    // Step 2: Add delegates to meeting (if provided)
    if (Array.isArray(delegates) && delegates.length > 0) {
      console.log('[Televic] Adding delegates:', delegates);
      for (const delegateId of delegates) {
        try {
          await sendCommand('/Meeting_Agenda/AddDelegatesToMeeting', {
            MeetingId: televicMeetingId,
            DelegateIds: String(delegateId)
          });
        } catch (e) {
          console.error(`[Televic] Failed to add delegate ${delegateId}:`, e.message);
        }
      }
    }

    // Step 3: Update database with televicMeetingId
    await prisma.meeting.update({
      where: { id: Number(meetingId) },
      data: { televicMeetingId: Number(televicMeetingId) }
    });

    res.json({
      ok: true,
      meetingId: Number(meetingId),
      televicMeetingId: Number(televicMeetingId),
      title
    });
  } catch (e) {
    console.error('[Televic] Error creating meeting:', e);
    res.status(500).json({ error: e.message });
  }
});

// Stop meeting in Televic CoCon
router.post('/meeting/stop', async (req, res) => {
  try {
    const { meetingId } = req.body;
    if (!meetingId) {
      return res.status(400).json({ error: 'meetingId is required' });
    }

    // Get meeting from database to find televicMeetingId
    const meeting = await prisma.meeting.findUnique({
      where: { id: Number(meetingId) },
      select: { id: true, name: true, televicMeetingId: true }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (!meeting.televicMeetingId) {
      // Meeting was never created in Televic, just return success
      return res.json({ ok: true, message: 'Meeting was not created in Televic' });
    }

    if (!io) return res.status(500).json({ error: 'Socket.IO not available' });

    // Find connector socket
    const coconNS = io.of('/cocon-connector');
    let socket = null;
    for (const [sid, sock] of coconNS.sockets) {
      socket = sock;
      break;
    }

    if (!socket) {
      return res.status(503).json({ error: 'No connector online' });
    }

    // Send command to stop meeting
    const commandId = require('crypto').randomUUID();
    const stopResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('connector:command:result', handler);
        reject(new Error('Timeout waiting for stop meeting response'));
      }, 15000);

      const handler = (msg) => {
        if (msg && msg.id === commandId) {
          clearTimeout(timeout);
          socket.off('connector:command:result', handler);
          resolve(msg);
        }
      };

      socket.on('connector:command:result', handler);
      socket.emit('server:command:exec', {
        id: commandId,
        type: 'ConnectorHttp',
        payload: {
          method: 'GET',
          url: '/Meeting_Agenda/EndActiveMeeting'
        }
      });
    });

    if (!stopResult.ok) {
      return res.status(500).json({ error: 'Failed to stop meeting in Televic', details: stopResult.error });
    }

    console.log('[Televic] Stopped meeting:', meeting.name, 'ID:', meeting.televicMeetingId);

    res.json({
      ok: true,
      meetingId: meeting.id,
      televicMeetingId: meeting.televicMeetingId,
      message: 'Meeting stopped in Televic'
    });
  } catch (e) {
    console.error('[Televic] Error stopping meeting:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get all meetings from Televic CoCon
router.get('/meetings', async (req, res) => {
  try {
    if (!io) return res.status(500).json({ error: 'Socket.IO not available' });

    // Find connector socket
    const coconNS = io.of('/cocon-connector');
    let socket = null;
    for (const [sid, sock] of coconNS.sockets) {
      socket = sock;
      break;
    }

    if (!socket) {
      return res.status(503).json({ error: 'No connector online' });
    }

    // Send command to get all meetings
    const commandId = require('crypto').randomUUID();
    const meetingsResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.off('connector:command:result', handler);
        reject(new Error('Timeout waiting for meetings list'));
      }, 15000);

      const handler = (msg) => {
        if (msg && msg.id === commandId) {
          clearTimeout(timeout);
          socket.off('connector:command:result', handler);
          resolve(msg);
        }
      };

      socket.on('connector:command:result', handler);
      socket.emit('server:command:exec', {
        id: commandId,
        type: 'ConnectorHttp',
        payload: {
          method: 'GET',
          url: '/Meeting_Agenda/GetAllMeetings'
        }
      });
    });

    if (!meetingsResult.ok) {
      return res.status(500).json({ error: 'Failed to get meetings from Televic', details: meetingsResult.error });
    }

    const meetingsData = meetingsResult.data.data;
    const parsed = typeof meetingsData === 'string' ? JSON.parse(meetingsData) : meetingsData;
    const meetings = parsed?.GetAllMeetings?.Meetings || [];

    res.json({ ok: true, meetings });
  } catch (e) {
    console.error('[Televic] Error getting meetings:', e);
    res.status(500).json({ error: e.message });
  }
});

return router;
};
