// routes/test.js
const express = require('express');
const router = express.Router();

// GET /api/test
router.get('/', (req, res) => {
  res.json({ message: 'привет' });
});

/**
 * POST /api/test/create-users
 * Создает 38 тестовых пользователей и тестовую группу "Тестовая группа 10"
 *
 * Параметры:
 * - count: количество пользователей (по умолчанию 38)
 * - divisionName: название группы (по умолчанию "Тестовая группа 10")
 * - startId: начальный номер (по умолчанию 10)
 *
 * Создает пользователей:
 * - Имя (name): "10", "11", "12", ... "47"
 * - Email: "10@10.ru", "11@10.ru", ... "47@10.ru"
 * - Username: "10", "11", "12", ... "47"
 * - Пароль: "123" (простой текст для тестов)
 */
router.post('/create-users', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const count = parseInt(req.body.count) || 38;
    const divisionName = req.body.divisionName || 'Тестовая группа 10';
    const startId = parseInt(req.body.startId) || 10;
    const password = req.body.password || '123';

    console.log(`[TEST] Creating ${count} test users starting from ID ${startId}`);
    console.log(`[TEST] Division name: ${divisionName}`);

    // 1. Создать или найти группу (подразделение)
    let division = await prisma.division.findFirst({
      where: { name: divisionName }
    });

    if (!division) {
      console.log('[TEST] Division not found, creating new one...');
      division = await prisma.division.create({
        data: { name: divisionName }
      });
      console.log(`[TEST] Created division: ${division.name} (ID: ${division.id})`);
    } else {
      console.log(`[TEST] Found existing division: ${division.name} (ID: ${division.id})`);
    }

    // 2. Создать пользователей (пароль будет сохранен как есть - для тестов это нормально)
    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      const userId = startId + i;
      const name = `${userId}`;
      const email = `${userId}@10.ru`;
      const username = `${userId}`;

      try {
        // Проверить, существует ли уже пользователь
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: email },
              { username: username }
            ]
          }
        });

        if (existingUser) {
          console.log(`[TEST] User ${username} already exists, skipping...`);
          errors.push({
            userId,
            email,
            username,
            error: 'User already exists'
          });
          continue;
        }

        const user = await prisma.user.create({
          data: {
            name: name,
            email: email,
            username: username,
            password: password, // Простой пароль для тестов
            divisionId: division.id,
            isAdmin: false,
            isOnline: false
          }
        });

        createdUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username
        });

        console.log(`[TEST] Created user: ${username} (ID: ${user.id})`);
      } catch (error) {
        console.error(`[TEST] Error creating user ${username}:`, error.message);
        errors.push({
          userId,
          email,
          username,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Created ${createdUsers.length} test users`,
      division: {
        id: division.id,
        name: division.name
      },
      created: createdUsers.length,
      skipped: errors.length,
      total: count,
      users: createdUsers,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[TEST] Error in create-users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /api/test/delete-users
 * Удаляет тестовых пользователей и опционально группу
 *
 * Параметры:
 * - startId: начальный ID (по умолчанию 10)
 * - count: количество пользователей (по умолчанию 38)
 * - divisionName: название группы для удаления (опционально)
 * - deleteDivision: удалить ли группу (по умолчанию false)
 *
 * Удаляет пользователей с username: "10", "11", ..., "47"
 */
router.delete('/delete-users', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const startId = parseInt(req.body.startId || req.query.startId) || 10;
    const count = parseInt(req.body.count || req.query.count) || 38;
    const divisionName = req.body.divisionName || req.query.divisionName || 'Тестовая группа 10';
    const deleteDivision = req.body.deleteDivision === true || req.query.deleteDivision === 'true';

    console.log(`[TEST] Deleting ${count} test users starting from ID ${startId}`);

    // 1. Собрать usernames для удаления
    const usernames = [];
    for (let i = 0; i < count; i++) {
      usernames.push(`${startId + i}`);
    }

    console.log(`[TEST] Usernames to delete:`, usernames.slice(0, 5), '...', usernames.slice(-2));

    // 2. Удалить пользователей
    const deleteResult = await prisma.user.deleteMany({
      where: {
        username: {
          in: usernames
        }
      }
    });

    console.log(`[TEST] Deleted ${deleteResult.count} users`);

    // 3. Опционально удалить группу
    let divisionDeleted = false;
    if (deleteDivision) {
      const division = await prisma.division.findFirst({
        where: { name: divisionName }
      });

      if (division) {
        // Проверить, остались ли пользователи в группе
        const remainingUsers = await prisma.user.count({
          where: { divisionId: division.id }
        });

        if (remainingUsers === 0) {
          await prisma.division.delete({
            where: { id: division.id }
          });
          divisionDeleted = true;
          console.log(`[TEST] Deleted division: ${divisionName} (ID: ${division.id})`);
        } else {
          console.log(`[TEST] Division ${divisionName} still has ${remainingUsers} users, not deleting`);
        }
      } else {
        console.log(`[TEST] Division ${divisionName} not found`);
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deleteResult.count} test users`,
      deleted: deleteResult.count,
      divisionDeleted: divisionDeleted,
      divisionName: deleteDivision ? divisionName : null
    });

  } catch (error) {
    console.error('[TEST] Error in delete-users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/test/count-users
 * Подсчитывает тестовых пользователей
 *
 * Параметры:
 * - startId: начальный ID (по умолчанию 10)
 * - count: количество пользователей (по умолчанию 38)
 */
router.get('/count-users', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const startId = parseInt(req.query.startId) || 10;
    const count = parseInt(req.query.count) || 38;

    const usernames = [];
    for (let i = 0; i < count; i++) {
      usernames.push(`${startId + i}`);
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          in: usernames
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        divisionId: true,
        division: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      found: users.length,
      expected: count,
      users: users
    });

  } catch (error) {
    console.error('[TEST] Error in count-users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test/create-guests
 * Создает тестовых гостевых пользователей G1, G2, G3, ... G5 и добавляет в группу "👥Приглашенные"
 *
 * Параметры:
 * - count: количество гостей (по умолчанию 5)
 * - startId: начальный номер (по умолчанию 1)
 * - password: пароль (по умолчанию "123")
 *
 * Создает пользователей:
 * - Имя (name): "G1", "G2", "G3", ... "G5"
 * - Email: "G1@10", "G2@10", ... "G5@10"
 * - Username: "G1", "G2", "G3", ... "G5"
 * - Пароль: "123" (простой текст для тестов)
 * - Группа: "👥Приглашенные" (системная группа для гостей)
 */
router.post('/create-guests', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const count = parseInt(req.body.count) || 5;
    const startId = parseInt(req.body.startId) || 1;
    const password = req.body.password || '123';
    const divisionName = '👥Приглашенные';

    console.log(`[TEST] Creating ${count} guest users starting from G${startId}`);
    console.log(`[TEST] Division name: ${divisionName}`);

    // 1. Найти или создать группу "👥Приглашенные"
    let division = await prisma.division.findFirst({
      where: { name: divisionName }
    });

    if (!division) {
      console.log('[TEST] Guests division not found, creating...');
      division = await prisma.division.create({
        data: { name: divisionName }
      });
      console.log(`[TEST] Created division: ${division.name} (ID: ${division.id})`);
    } else {
      console.log(`[TEST] Found existing division: ${division.name} (ID: ${division.id})`);
    }

    // 2. Создать гостевых пользователей
    const createdUsers = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      const guestNumber = startId + i;
      const name = `G${guestNumber}`;
      const email = `G${guestNumber}@10`;
      const username = `G${guestNumber}`;

      try {
        // Проверить, существует ли уже пользователь
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: email },
              { username: username }
            ]
          }
        });

        if (existingUser) {
          console.log(`[TEST] Guest ${username} already exists, skipping...`);
          errors.push({
            guestNumber,
            email,
            username,
            error: 'Guest already exists'
          });
          continue;
        }

        const user = await prisma.user.create({
          data: {
            name: name,
            email: email,
            username: username,
            password: password,
            divisionId: division.id,
            isAdmin: false,
            isOnline: false
          }
        });

        createdUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username
        });

        console.log(`[TEST] Created guest: ${username} (ID: ${user.id})`);
      } catch (error) {
        console.error(`[TEST] Error creating guest ${username}:`, error.message);
        errors.push({
          guestNumber,
          email,
          username,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Created ${createdUsers.length} guest users`,
      division: {
        id: division.id,
        name: division.name
      },
      created: createdUsers.length,
      skipped: errors.length,
      total: count,
      users: createdUsers,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[TEST] Error in create-guests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /api/test/delete-guests
 * Удаляет тестовых гостевых пользователей G1, G2, G3, ... G5
 *
 * Параметры:
 * - count: количество гостей (по умолчанию 5)
 * - startId: начальный номер (по умолчанию 1)
 * - deleteDivision: удалить ли группу "👥Приглашенные" если она пустая (по умолчанию false)
 *
 * Удаляет пользователей с username: "G1", "G2", ... "G5"
 */
router.delete('/delete-guests', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const startId = parseInt(req.body.startId || req.query.startId) || 1;
    const count = parseInt(req.body.count || req.query.count) || 5;
    const deleteDivision = req.body.deleteDivision === true || req.query.deleteDivision === 'true';
    const divisionName = '👥Приглашенные';

    console.log(`[TEST] Deleting ${count} guest users starting from G${startId}`);

    // 1. Собрать usernames для удаления
    const usernames = [];
    for (let i = 0; i < count; i++) {
      usernames.push(`G${startId + i}`);
    }

    console.log(`[TEST] Guest usernames to delete:`, usernames);

    // 2. Удалить гостевых пользователей
    const deleteResult = await prisma.user.deleteMany({
      where: {
        username: {
          in: usernames
        }
      }
    });

    console.log(`[TEST] Deleted ${deleteResult.count} guests`);

    // 3. Опционально удалить группу
    let divisionDeleted = false;
    if (deleteDivision) {
      const division = await prisma.division.findFirst({
        where: { name: divisionName }
      });

      if (division) {
        // Проверить, остались ли пользователи в группе
        const remainingUsers = await prisma.user.count({
          where: { divisionId: division.id }
        });

        if (remainingUsers === 0) {
          await prisma.division.delete({
            where: { id: division.id }
          });
          divisionDeleted = true;
          console.log(`[TEST] Deleted division: ${divisionName} (ID: ${division.id})`);
        } else {
          console.log(`[TEST] Division ${divisionName} still has ${remainingUsers} users, not deleting`);
        }
      } else {
        console.log(`[TEST] Division ${divisionName} not found`);
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deleteResult.count} guest users`,
      deleted: deleteResult.count,
      divisionDeleted: divisionDeleted,
      divisionName: deleteDivision ? divisionName : null
    });

  } catch (error) {
    console.error('[TEST] Error in delete-guests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/test/count-guests
 * Подсчитывает тестовых гостевых пользователей
 *
 * Параметры:
 * - startId: начальный номер (по умолчанию 1)
 * - count: количество гостей (по умолчанию 5)
 */
router.get('/count-guests', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const startId = parseInt(req.query.startId) || 1;
    const count = parseInt(req.query.count) || 5;

    const usernames = [];
    for (let i = 0; i < count; i++) {
      usernames.push(`G${startId + i}`);
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          in: usernames
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        divisionId: true,
        division: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      found: users.length,
      expected: count,
      users: users
    });

  } catch (error) {
    console.error('[TEST] Error in count-guests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test/create-meeting
 * Создает тестовое заседание с 3 вопросами повестки
 *
 * Параметры:
 * - type: тип кворума ("TWO_THIRDS_FIXED" | "TWO_THIRDS_REGISTERED" | "HALF_PLUS_ONE")
 *   - TWO_THIRDS_FIXED: Не менее 2/3 от установленного числа депутатов (voteProcedureId=3)
 *   - TWO_THIRDS_REGISTERED: 2/3 от установленного (кворум >1)
 *   - HALF_PLUS_ONE: Половина +1 (voteProcedureId=4)
 *
 * Создает:
 * - Заседание "Десятое тест сайт ({тип})"
 * - Добавляет группы: "Тестовая группа 10" и "👥Приглашенные"
 * - 3 вопроса повестки с докладчиками "Иван 1", "Иван 2", "Иван 3"
 */
router.post('/create-meeting', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const type = req.body.type || 'TWO_THIRDS_FIXED';

    // Определить параметры заседания по типу
    let meetingName, voteProcedureId, quorumValue;

    switch (type) {
      case 'TWO_THIRDS_FIXED':
        meetingName = 'Десятое тест сайт (Не менее 2/3 от установленного числа депутатов)';
        voteProcedureId = 3; // Не менее 2/3 от установленного
        quorumValue = null;
        break;
      case 'TWO_THIRDS_REGISTERED':
        meetingName = 'Десятое тест сайт 2/3 от установленного';
        voteProcedureId = 3; // 2/3 от установленного
        quorumValue = 2; // Больше 1
        break;
      case 'HALF_PLUS_ONE':
        meetingName = 'Десятое тест сайт Половина +1';
        voteProcedureId = 4; // Большинство от установленного (0.5)
        quorumValue = null;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid meeting type: ${type}. Must be TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, or HALF_PLUS_ONE`
        });
    }

    console.log(`[TEST] Creating meeting: ${meetingName}`);
    console.log(`[TEST] Vote procedure ID: ${voteProcedureId}`);

    // 1. Найти группы
    const testDivision = await prisma.division.findFirst({
      where: { name: 'Тестовая группа 10' }
    });

    const guestDivision = await prisma.division.findFirst({
      where: { name: 'Приглашенные' }
    });

    if (!testDivision) {
      return res.status(400).json({
        success: false,
        error: 'Division "Тестовая группа 10" not found. Create test users first using /api/test/create-users'
      });
    }

    console.log(`[TEST] Found test division: ${testDivision.name} (ID: ${testDivision.id})`);
    if (guestDivision) {
      console.log(`[TEST] Found guest division: ${guestDivision.name} (ID: ${guestDivision.id})`);
    }

    // 2. Создать заседание
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // +4 часа

    const meeting = await prisma.meeting.create({
      data: {
        name: meetingName,
        startTime: startTime,
        endTime: endTime,
        status: 'WAITING',
        voteProcedureId: voteProcedureId,
        ...(quorumValue !== null && { quorumType: quorumValue }),
        divisions: {
          connect: guestDivision
            ? [{ id: testDivision.id }, { id: guestDivision.id }]
            : [{ id: testDivision.id }]
        }
      },
      include: {
        divisions: true
      }
    });

    console.log(`[TEST] Created meeting: ${meeting.name} (ID: ${meeting.id})`);

    // 3. Создать 3 вопроса повестки
    const agendaItems = [];
    for (let i = 1; i <= 3; i++) {
      const agendaItem = await prisma.agendaItem.create({
        data: {
          number: i,
          title: `Вопрос ${i}`,
          speakerName: `Иван ${i}`,
          meetingId: meeting.id
        }
      });
      agendaItems.push(agendaItem);
      console.log(`[TEST] Created agenda item: ${agendaItem.title} (ID: ${agendaItem.id})`);
    }

    res.json({
      success: true,
      message: `Created test meeting: ${meetingName}`,
      meeting: {
        id: meeting.id,
        name: meeting.name,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
        voteProcedureId: meeting.voteProcedureId,
        quorumType: meeting.quorumType,
        divisions: meeting.divisions.map(d => ({
          id: d.id,
          name: d.name
        }))
      },
      agendaItems: agendaItems.map(item => ({
        id: item.id,
        number: item.number,
        title: item.title,
        speakerName: item.speakerName
      }))
    });

  } catch (error) {
    console.error('[TEST] Error in create-meeting:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /api/test/delete-meeting
 * Удаляет тестовое заседание по типу
 *
 * Параметры:
 * - type: тип кворума ("TWO_THIRDS_FIXED" | "TWO_THIRDS_REGISTERED" | "HALF_PLUS_ONE")
 * - или id: ID заседания для удаления
 */
router.delete('/delete-meeting', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const type = req.body.type || req.query.type;
    const meetingId = req.body.id || req.query.id;

    let meetingName;

    if (meetingId) {
      // Удалить по ID
      console.log(`[TEST] Deleting meeting by ID: ${meetingId}`);

      // Удалить связанные agenda items
      await prisma.agendaItem.deleteMany({
        where: { meetingId: parseInt(meetingId) }
      });

      await prisma.meeting.delete({
        where: { id: parseInt(meetingId) }
      });

      return res.json({
        success: true,
        message: `Deleted meeting with ID: ${meetingId}`,
        deletedId: parseInt(meetingId)
      });
    }

    // Удалить по типу
    switch (type) {
      case 'TWO_THIRDS_FIXED':
        meetingName = 'Десятое тест сайт (Не менее 2/3 от установленного числа депутатов)';
        break;
      case 'TWO_THIRDS_REGISTERED':
        meetingName = 'Десятое тест сайт 2/3 от установленного';
        break;
      case 'HALF_PLUS_ONE':
        meetingName = 'Десятое тест сайт Половина +1';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid meeting type: ${type}. Must be TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, or HALF_PLUS_ONE`
        });
    }

    console.log(`[TEST] Deleting meeting: ${meetingName}`);

    // Найти заседание
    const meeting = await prisma.meeting.findFirst({
      where: { name: meetingName }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: `Meeting not found: ${meetingName}`
      });
    }

    // Удалить agenda items
    const deletedAgenda = await prisma.agendaItem.deleteMany({
      where: { meetingId: meeting.id }
    });

    console.log(`[TEST] Deleted ${deletedAgenda.count} agenda items`);

    // Удалить заседание
    await prisma.meeting.delete({
      where: { id: meeting.id }
    });

    console.log(`[TEST] Deleted meeting: ${meetingName} (ID: ${meeting.id})`);

    res.json({
      success: true,
      message: `Deleted meeting: ${meetingName}`,
      deletedId: meeting.id,
      deletedAgendaItems: deletedAgenda.count
    });

  } catch (error) {
    console.error('[TEST] Error in delete-meeting:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/test/list-meetings
 * Список всех тестовых заседаний
 */
router.get('/list-meetings', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const meetings = await prisma.meeting.findMany({
      where: {
        name: {
          startsWith: 'Десятое тест сайт'
        }
      },
      include: {
        divisions: {
          select: {
            id: true,
            name: true
          }
        },
        agendaItems: {
          select: {
            id: true,
            number: true,
            title: true,
            speakerName: true
          },
          orderBy: {
            number: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      found: meetings.length,
      meetings: meetings.map(m => ({
        id: m.id,
        name: m.name,
        startTime: m.startTime,
        endTime: m.endTime,
        status: m.status,
        voteProcedureId: m.voteProcedureId,
        quorumType: m.quorumType,
        divisions: m.divisions,
        agendaItems: m.agendaItems
      }))
    });

  } catch (error) {
    console.error('[TEST] Error in list-meetings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test/create-meeting-televic
 * Создает тестовое заседание с интеграцией Televic (галочка "Сайт + Televic")
 *
 * Параметры:
 * - type: тип кворума ("TWO_THIRDS_FIXED" | "TWO_THIRDS_REGISTERED" | "HALF_PLUS_ONE")
 *   - TWO_THIRDS_FIXED: Не менее 2/3 от установленного числа депутатов (voteProcedureId=3)
 *   - TWO_THIRDS_REGISTERED: 2/3 от установленного (кворум >1)
 *   - HALF_PLUS_ONE: Половина +1 (voteProcedureId=4)
 *
 * Создает:
 * - Заседание "Десятое тест сайт телевик ({тип})"
 * - Добавляет группы: "Тестовая группа 10" и "👥Приглашенные"
 * - createInTelevic: true (галочка "Сайт + Televic")
 * - 3 вопроса повестки с докладчиками "Иван 1", "Иван 2", "Иван 3"
 */
router.post('/create-meeting-televic', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const type = req.body.type || 'TWO_THIRDS_FIXED';

    // Определить параметры заседания по типу
    let meetingName, voteProcedureId, quorumValue;

    switch (type) {
      case 'TWO_THIRDS_FIXED':
        meetingName = 'Десятое тест сайт телевик (Не менее 2/3 от установленного числа депутатов)';
        voteProcedureId = 3; // Не менее 2/3 от установленного
        quorumValue = null;
        break;
      case 'TWO_THIRDS_REGISTERED':
        meetingName = 'Десятое тест сайт телевик 2/3 от установленного';
        voteProcedureId = 3; // 2/3 от установленного
        quorumValue = 'MORE_THAN_ONE'; // Больше 1
        break;
      case 'HALF_PLUS_ONE':
        meetingName = 'Десятое тест сайт телевик Половина +1';
        voteProcedureId = 4; // Большинство от установленного (0.5)
        quorumValue = null;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid meeting type: ${type}. Must be TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, or HALF_PLUS_ONE`
        });
    }

    console.log(`[TEST] Creating Televic meeting: ${meetingName}`);
    console.log(`[TEST] Vote procedure ID: ${voteProcedureId}`);
    console.log(`[TEST] createInTelevic: true`);

    // 1. Найти группы
    const testDivision = await prisma.division.findFirst({
      where: { name: 'Тестовая группа 10' }
    });

    const guestDivision = await prisma.division.findFirst({
      where: { name: 'Приглашенные' }
    });

    if (!testDivision) {
      return res.status(400).json({
        success: false,
        error: 'Division "Тестовая группа 10" not found. Create test users first using /api/test/create-users'
      });
    }

    console.log(`[TEST] Found test division: ${testDivision.name} (ID: ${testDivision.id})`);
    if (guestDivision) {
      console.log(`[TEST] Found guest division: ${guestDivision.name} (ID: ${guestDivision.id})`);
    }

    // 2. Создать заседание с интеграцией Televic
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // +4 часа

    const meeting = await prisma.meeting.create({
      data: {
        name: meetingName,
        startTime: startTime,
        endTime: endTime,
        status: 'WAITING',
        voteProcedureId: voteProcedureId,
        createInTelevic: true, // ⭐ Галочка "Сайт + Televic"
        ...(quorumValue !== null && { quorumType: quorumValue }),
        divisions: {
          connect: guestDivision
            ? [{ id: testDivision.id }, { id: guestDivision.id }]
            : [{ id: testDivision.id }]
        }
      },
      include: {
        divisions: true
      }
    });

    console.log(`[TEST] Created Televic meeting: ${meeting.name} (ID: ${meeting.id})`);
    console.log(`[TEST] createInTelevic flag is set to: ${meeting.createInTelevic}`);

    // 3. Создать 3 вопроса повестки
    const agendaItems = [];
    for (let i = 1; i <= 3; i++) {
      const agendaItem = await prisma.agendaItem.create({
        data: {
          number: i,
          title: `Вопрос ${i}`,
          speakerName: `Иван ${i}`,
          meetingId: meeting.id
        }
      });
      agendaItems.push(agendaItem);
      console.log(`[TEST] Created agenda item: ${agendaItem.title} (ID: ${agendaItem.id})`);
    }

    res.json({
      success: true,
      message: `Created Televic test meeting: ${meetingName}`,
      meeting: {
        id: meeting.id,
        name: meeting.name,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        status: meeting.status,
        voteProcedureId: meeting.voteProcedureId,
        quorumType: meeting.quorumType,
        createInTelevic: meeting.createInTelevic,
        divisions: meeting.divisions.map(d => ({
          id: d.id,
          name: d.name
        }))
      },
      agendaItems: agendaItems.map(item => ({
        id: item.id,
        number: item.number,
        title: item.title,
        speakerName: item.speakerName
      }))
    });

  } catch (error) {
    console.error('[TEST] Error in create-meeting-televic:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /api/test/delete-meeting-televic
 * Удаляет тестовое заседание Televic по типу
 *
 * Параметры:
 * - type: тип кворума ("TWO_THIRDS_FIXED" | "TWO_THIRDS_REGISTERED" | "HALF_PLUS_ONE")
 * - или id: ID заседания для удаления
 */
router.delete('/delete-meeting-televic', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const type = req.body.type || req.query.type;
    const meetingId = req.body.id || req.query.id;

    let meetingName;

    if (meetingId) {
      // Удалить по ID
      console.log(`[TEST] Deleting Televic meeting by ID: ${meetingId}`);

      // Удалить связанные agenda items
      await prisma.agendaItem.deleteMany({
        where: { meetingId: parseInt(meetingId) }
      });

      await prisma.meeting.delete({
        where: { id: parseInt(meetingId) }
      });

      return res.json({
        success: true,
        message: `Deleted Televic meeting with ID: ${meetingId}`,
        deletedId: parseInt(meetingId)
      });
    }

    // Удалить по типу
    switch (type) {
      case 'TWO_THIRDS_FIXED':
        meetingName = 'Десятое тест сайт телевик (Не менее 2/3 от установленного числа депутатов)';
        break;
      case 'TWO_THIRDS_REGISTERED':
        meetingName = 'Десятое тест сайт телевик 2/3 от установленного';
        break;
      case 'HALF_PLUS_ONE':
        meetingName = 'Десятое тест сайт телевик Половина +1';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid meeting type: ${type}. Must be TWO_THIRDS_FIXED, TWO_THIRDS_REGISTERED, or HALF_PLUS_ONE`
        });
    }

    console.log(`[TEST] Deleting Televic meeting: ${meetingName}`);

    // Найти заседание
    const meeting = await prisma.meeting.findFirst({
      where: { name: meetingName }
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: `Televic meeting not found: ${meetingName}`
      });
    }

    // Удалить agenda items
    const deletedAgenda = await prisma.agendaItem.deleteMany({
      where: { meetingId: meeting.id }
    });

    console.log(`[TEST] Deleted ${deletedAgenda.count} agenda items`);

    // Удалить заседание
    await prisma.meeting.delete({
      where: { id: meeting.id }
    });

    console.log(`[TEST] Deleted Televic meeting: ${meetingName} (ID: ${meeting.id})`);

    res.json({
      success: true,
      message: `Deleted Televic meeting: ${meetingName}`,
      deletedId: meeting.id,
      deletedAgendaItems: deletedAgenda.count
    });

  } catch (error) {
    console.error('[TEST] Error in delete-meeting-televic:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/test/list-meetings-televic
 * Список всех тестовых заседаний Televic
 */
router.get('/list-meetings-televic', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = req.prisma || new PrismaClient();

    const meetings = await prisma.meeting.findMany({
      where: {
        name: {
          startsWith: 'Десятое тест сайт телевик'
        }
      },
      include: {
        divisions: {
          select: {
            id: true,
            name: true
          }
        },
        agendaItems: {
          select: {
            id: true,
            number: true,
            title: true,
            speakerName: true
          },
          orderBy: {
            number: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      found: meetings.length,
      meetings: meetings.map(m => ({
        id: m.id,
        name: m.name,
        startTime: m.startTime,
        endTime: m.endTime,
        status: m.status,
        voteProcedureId: m.voteProcedureId,
        quorumType: m.quorumType,
        createInTelevic: m.createInTelevic,
        televicMeetingId: m.televicMeetingId,
        divisions: m.divisions,
        agendaItems: m.agendaItems
      }))
    });

  } catch (error) {
    console.error('[TEST] Error in list-meetings-televic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/test/refresh-prisma
 * Переподключает Prisma клиент для обновления кеша после изменения televicExternalId
 *
 * Использовать после:
 * - Изменения televicExternalId у пользователей
 * - Удаления и создания пользователей с Televic связями
 * - Любых изменений в маппинге пользователей с делегатами
 *
 * Альтернатива: pm2 restart voting-api
 */
router.post('/refresh-prisma', async (req, res) => {
  try {
    console.log('[TEST] Refreshing Prisma client connection...');

    // Попробовать получить глобальный prisma из Express app
    const app = req.app;
    if (app && app.locals && app.locals.prisma) {
      await app.locals.prisma.$disconnect();
      console.log('[TEST] Disconnected global Prisma client');

      // Переподключить
      await app.locals.prisma.$connect();
      console.log('[TEST] Reconnected global Prisma client');
    }

    res.json({
      success: true,
      message: 'Prisma client refreshed. Badge events should now use updated televicExternalId mappings.',
      note: 'If this does not work, use: pm2 restart voting-api'
    });

  } catch (error) {
    console.error('[TEST] Error refreshing Prisma:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'Try manual restart: pm2 restart voting-api'
    });
  }
});

module.exports = router;
