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

module.exports = router;
