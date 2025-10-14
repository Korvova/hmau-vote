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
    const { userId, action } = req.body; // action: 'enable' | 'disable'
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!action || !['enable', 'disable'].includes(action)) {
      return res.status(400).json({ error: 'action must be "enable" or "disable"' });
    }

    // Find user's televicExternalId
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { televicExternalId: true, name: true }
    });

    if (!user?.televicExternalId) {
      return res.status(400).json({ error: 'User not linked to Televic delegate' });
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
      return res.status(400).json({ error: 'No running meeting in CoCon' });
    }

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
      return res.status(400).json({ error: 'Delegate not in seating for this meeting' });
    }

    // Toggle microphone
    const micAction = action === 'enable' ? 'SetMicrophoneOn' : 'SetMicrophoneOff';
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
          url: `/Microphone/${micAction}`,
          query: { SeatId: delegateSeat.SeatId }
        }
      });
    });

    if (!micResult.ok) {
      return res.status(500).json({ error: 'Failed to toggle microphone', details: micResult.error });
    }

    res.json({
      ok: true,
      action,
      user: user.name,
      seatId: delegateSeat.SeatId
    });
  } catch (e) {
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

return router;
};
