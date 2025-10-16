const express = require('express');

module.exports = (prisma, io) => {
  const router = express.Router({ mergeParams: true });

  // Middleware to attach prisma and io to req object
  router.use((req, res, next) => {
    req.prisma = prisma;
    req.io = io;
    next();
  });

  /**
   * @api {get} /api/meetings/:id/queue/:type Получить очередь
   * @apiName GetQueue
   * @apiGroup Queue
   * @apiDescription Получает очередь определенного типа (QUESTION/SPEECH) для заседания
   */
  router.get('/:type', async (req, res) => {
    const { id, type } = req.params;

    try{
      // Validate type
      if (!['QUESTION', 'SPEECH'].includes(type)) {
        return res.status(400).json({ error: 'Invalid queue type. Must be QUESTION or SPEECH' });
      }

      const queue = await req.prisma.queue.findMany({
        where: {
          meetingId: parseInt(id),
          type: type,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isOnline: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // ACTIVE первым
          { position: 'asc' },
        ],
      });
  
      res.json(queue);
    } catch (error) {
      console.error('Error fetching queue:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @api {post} /api/meetings/:id/queue/:type Встать в очередь
   * @apiName JoinQueue
   * @apiGroup Queue
   * @apiDescription Пользователь встает в очередь
   */
  router.post('/:type', async (req, res) => {
    const { id, type } = req.params;
    const { userId } = req.body;
  
    try {
      if (!['QUESTION', 'SPEECH'].includes(type)) {
        return res.status(400).json({ error: 'Invalid queue type' });
      }
  
      // Check if user already in queue
      const existing = await req.prisma.queue.findUnique({
        where: {
          meetingId_userId_type: {
            meetingId: parseInt(id),
            userId: parseInt(userId),
            type: type,
          },
        },
      });
  
      if (existing) {
        return res.status(400).json({ error: 'User already in queue' });
      }
  
      // Get max position
      const maxPosition = await req.prisma.queue.aggregate({
        where: {
          meetingId: parseInt(id),
          type: type,
        },
        _max: {
          position: true,
        },
      });
  
      const newPosition = (maxPosition._max.position || 0) + 1;
  
      const queueEntry = await req.prisma.queue.create({
        data: {
          meetingId: parseInt(id),
          userId: parseInt(userId),
          type: type,
          position: newPosition,
          status: 'WAITING',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isOnline: true,
            },
          },
        },
      });
  
      // Emit socket event
      if (io) {
        io.emit('queue-updated', {
          meetingId: parseInt(id),
          type: type,
          action: 'joined',
          entry: queueEntry,
        });
      }
  
      res.json(queueEntry);
    } catch (error) {
      console.error('Error joining queue:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @api {delete} /api/meetings/:id/queue/:userId/:type Выйти из очереди
   * @apiName LeaveQueue
   * @apiGroup Queue
   * @apiDescription Удаляет пользователя из очереди (только админ)
   */
  router.delete('/:userId/:type', async (req, res) => {
    const { id, userId, type } = req.params;
  
    try {
      if (!['QUESTION', 'SPEECH'].includes(type)) {
        return res.status(400).json({ error: 'Invalid queue type' });
      }
  
      const deleted = await req.prisma.queue.delete({
        where: {
          meetingId_userId_type: {
            meetingId: parseInt(id),
            userId: parseInt(userId),
            type: type,
          },
        },
      });
  
      // Reorder positions
      await req.prisma.$executeRaw`
        UPDATE "Queue"
        SET position = position - 1
        WHERE "meetingId" = ${parseInt(id)}
          AND type = ${type}::"QueueType"
          AND position > ${deleted.position}
      `;
  
      // Emit socket event
      if (io) {
        io.emit('queue-updated', {
          meetingId: parseInt(id),
          type: type,
          action: 'removed',
          userId: parseInt(userId),
        });
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving queue:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @api {put} /api/meetings/:id/queue/start Запустить таймер
   * @apiName StartQueueTimer
   * @apiGroup Queue
   * @apiDescription Запускает таймер для первого в очереди
   */
  router.put('/start', async (req, res) => {
    const { id } = req.params;
    const { type, timerSeconds } = req.body;
  
    try {
      if (!['QUESTION', 'SPEECH'].includes(type)) {
        return res.status(400).json({ error: 'Invalid queue type' });
      }
  
      // Find first entry (either ACTIVE or first WAITING)
      let firstEntry = await req.prisma.queue.findFirst({
        where: {
          meetingId: parseInt(id),
          type: type,
          status: 'ACTIVE',
        },
        include: {
          user: true,
        },
      });
  
      // If no ACTIVE entry, find first WAITING
      if (!firstEntry) {
        firstEntry = await req.prisma.queue.findFirst({
          where: {
            meetingId: parseInt(id),
            type: type,
            status: 'WAITING',
          },
          orderBy: {
            position: 'asc',
          },
          include: {
            user: true,
          },
        });
      }
  
      if (!firstEntry) {
        return res.status(404).json({ error: 'No one in queue' });
      }
  
      const endTime = new Date(Date.now() + timerSeconds * 1000);
  
      const updated = await req.prisma.queue.update({
        where: { id: firstEntry.id },
        data: {
          status: 'ACTIVE',
          timerSeconds: timerSeconds,
          timerEndTime: endTime,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isOnline: true,
            },
          },
        },
      });
  
      // Emit socket event
      if (io) {
        io.emit('queue-timer-started', {
          meetingId: parseInt(id),
          type: type,
          entry: updated,
          timerSeconds: timerSeconds,
          timerEndTime: endTime.toISOString(),
        });
      }
  
      res.json(updated);
    } catch (error) {
      console.error('Error starting timer:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @api {put} /api/meetings/:id/queue/next Следующий в очереди
   * @apiName NextInQueue
   * @apiGroup Queue
   * @apiDescription Удаляет активного из очереди и переходит к следующему
   */
  router.put('/next', async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;
  
    try {
      if (!['QUESTION', 'SPEECH'].includes(type)) {
        return res.status(400).json({ error: 'Invalid queue type' });
      }
  
      // Find first entry (ACTIVE or first WAITING)
      let entryToRemove = await req.prisma.queue.findFirst({
        where: {
          meetingId: parseInt(id),
          type: type,
          status: 'ACTIVE',
        },
      });
  
      if (!entryToRemove) {
        // If no ACTIVE, find first WAITING
        entryToRemove = await req.prisma.queue.findFirst({
          where: {
            meetingId: parseInt(id),
            type: type,
            status: 'WAITING',
          },
          orderBy: { position: 'asc' },
        });
      }
  
      if (entryToRemove) {
        await req.prisma.queue.delete({
          where: { id: entryToRemove.id },
        });
  
        // Reorder positions
        await req.prisma.$executeRaw`
          UPDATE "Queue"
          SET position = position - 1
          WHERE "meetingId" = ${parseInt(id)}
            AND type = ${type}::"QueueType"
            AND position > ${entryToRemove.position}
        `;
      }
  
      // Get next entry
      const nextEntry = await req.prisma.queue.findFirst({
        where: {
          meetingId: parseInt(id),
          type: type,
          status: 'WAITING',
        },
        orderBy: {
          position: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isOnline: true,
            },
          },
        },
      });
  
      // Emit socket event
      if (io) {
        io.emit('queue-next', {
          meetingId: parseInt(id),
          type: type,
          nextEntry: nextEntry,
        });
      }
  
      res.json({ nextEntry });
    } catch (error) {
      console.error('Error moving to next:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @api {put} /api/meetings/:id/queue/end-timer Завершить таймер
   * @apiName EndQueueTimer
   * @apiGroup Queue
   * @apiDescription Завершает таймер и возвращает статус в WAITING (готов к запуску)
   */
  router.put('/end-timer', async (req, res) => {
    const { id } = req.params;
    const { type, userId } = req.body;
  
    try {
      if (!['QUESTION', 'SPEECH'].includes(type)) {
        return res.status(400).json({ error: 'Invalid queue type' });
      }
  
      // Find ACTIVE entry for this user
      const activeEntry = await req.prisma.queue.findFirst({
        where: {
          meetingId: parseInt(id),
          userId: parseInt(userId),
          type: type,
          status: 'ACTIVE',
        },
      });
  
      if (!activeEntry) {
        return res.status(404).json({ error: 'No active timer found' });
      }
  
      // Reset to WAITING status
      const updated = await req.prisma.queue.update({
        where: { id: activeEntry.id },
        data: {
          status: 'WAITING',
          timerEndTime: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isOnline: true,
            },
          },
        },
      });
  
      // Emit socket event for timer ended
      if (io) {
        io.emit('queue-timer-ended', {
          meetingId: parseInt(id),
          type: type,
          userId: parseInt(userId),
          entry: updated,
        });
      }
  
      res.json(updated);
    } catch (error) {
      console.error('Error ending timer:', error);
      res.status(500).json({ error: error.message });
    }
    });

  return router;
};
