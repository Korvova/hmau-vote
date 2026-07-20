const express = require('express');
const router = express.Router();

/**
 * @api {post} /api/users/:id/disconnect Отключение пользователя
 * @apiName ОтключениеПользователя
 * @apiGroup Пользователи
 * @apiDescription Устанавливает статус пользователя `isOnline` в значение `false`, что означает, что пользователь больше не активен в системе (например, вышел из приложения). Этот маршрут используется для управления состоянием подключения пользователя.
 * @apiParam {Number} id Идентификатор пользователя (параметр пути). Должен быть целым числом, соответствующим записи в таблице `User` базы данных.
 * @apiSuccess {Boolean} success Статус операции. Возвращает `true`, если отключение прошло успешно.
 * @apiSuccess {Object} user Обновлённый объект пользователя.
 * @apiSuccess {Number} user.id Идентификатор пользователя.
 * @apiSuccess {String} user.name Имя пользователя.
 * @apiSuccess {String} user.email Электронная почта пользователя.
 * @apiSuccess {String} [user.phone] Номер телефона пользователя (может быть `null`).
 * @apiSuccess {Boolean} user.isOnline Статус активности пользователя (`false` после отключения).
 * @apiSuccess {Number} [user.divisionId] Идентификатор подразделения, к которому привязан пользователь (может быть `null`).
 * @apiError (400) BadRequest Ошибка, если пользователь с указанным `id` не найден или передан некорректный `id`.
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Пользователь не найден"
 *     }
 * @apiExample {curl} Пример использования:
 *     curl -X POST http://217.114.10.226:5000/api/users/26/disconnect
 */
router.post('/:id/disconnect', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await req.prisma.user.update({
      where: { id: parseInt(id) },
      data: { isOnline: false },
    });
    // Emit realtime notification so clients can react immediately
    try {
      const payload = JSON.stringify({ id: Number(user.id), email: user.email, isOnline: false });
      await req.prisma.$executeRawUnsafe(`SELECT pg_notify('user_status_channel', '${payload.replace(/'/g, "''")}')`);
    } catch (e) {
      console.error('Failed to pg_notify user_status_channel:', e?.message || e);
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Ошибка при отключении пользователя:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {get} /api/users Получение списка всех пользователей
 * @apiName ПолучениеПользователей
 * @apiGroup Пользователи
 * @apiDescription Возвращает список всех пользователей, зарегистрированных в системе, с информацией об их подразделениях. Используется для отображения пользователей в интерфейсе администратора или для анализа данных.
 * @apiSuccess {Object[]} users Массив объектов пользователей.
 * @apiSuccess {Number} users.id Идентификатор пользователя.
 * @apiSuccess {String} users.name Имя пользователя.
 * @apiSuccess {String} users.email Электронная почта пользователя.
 * @apiSuccess {String} [users.phone] Номер телефона пользователя (может быть `null`).
 * @apiSuccess {String} users.division Название подразделения, к которому привязан пользователь, или строка `"Нет"`, если подразделение не указано.
 * @apiSuccess {Boolean} users.isOnline Статус активности пользователя (`true` — онлайн, `false` — оффлайн).
 * @apiError (500) ServerError Ошибка сервера или базы данных, например, при сбое подключения к PostgreSQL.
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Внутренняя ошибка сервера"
 *     }
 * @apiExample {curl} Пример использования:
 *     curl http://217.114.10.226:5000/api/users
 */
router.get('/', async (req, res) => {
  try {
    // Ensure helper table exists (safety)
    try {
      await req.prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "UserExtraDivision" (id SERIAL PRIMARY KEY, "userId" INT NOT NULL, "divisionId" INT NOT NULL)');
    } catch {}

    const users = await req.prisma.user.findMany({ include: { division: true } });
    const userIds = users.map(u => u.id);
    // Simpler: read all extras and filter in memory
    let extras = [];
    try {
      extras = await req.prisma.$queryRawUnsafe('SELECT "userId", "divisionId" FROM "UserExtraDivision"');
    } catch {}
    const extraMap = new Map();
    for (const row of Array.isArray(extras) ? extras : []) {
      if (!userIds.includes(row.userId)) continue;
      const arr = extraMap.get(row.userId) || [];
      arr.push(row.divisionId);
      extraMap.set(row.userId, arr);
    }

    const allDivisionIds = new Set();
    for (const u of users) (extraMap.get(u.id) || []).forEach(d => allDivisionIds.add(d));
    const divNames = new Map();
    if (allDivisionIds.size) {
      const idsArr = Array.from(allDivisionIds);
      try {
        const rows = await req.prisma.division.findMany({ where: { id: { in: idsArr } } });
        for (const d of rows) divNames.set(d.id, d.name);
      } catch {}
    }

    const out = users.map(user => {
      const extraIds = extraMap.get(user.id) || [];
      const names = [];
      if (user.division?.name) names.push(user.division.name);
      for (const did of extraIds) {
        const nm = divNames.get(did);
        if (nm && !names.includes(nm)) names.push(nm);
      }
      const pretty = names.map(n => (/(^|\s)Приглашенные(\s|$)/i.test(n) ? '👥Приглашенные' : n));
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        division: pretty.join(', ') || 'Нет',
        divisionIds: [user.divisionId, ...extraIds].filter(Boolean),
        isOnline: user.isOnline,
      };
    });
    try { console.log('[GET /api/users] out sample:', out.slice(0, 3)); } catch {}
    res.json(out);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {post} /api/users Создание нового пользователя
 * @apiName СозданиеПользователя
 * @apiGroup Пользователи
 * @apiDescription Создаёт нового пользователя в системе с указанными данными. Используется для регистрации новых участников системы, таких как сотрудники или члены организации. Обязательные поля: `name`, `email`, `password`.
 * @apiBody {String} name Имя пользователя (например, "Иван Иванов").
 * @apiBody {String} email Уникальный адрес электронной почты пользователя (например, "ivan@example.com").
 * @apiBody {String} [phone] Номер телефона пользователя (опционально, может быть `null`).
 * @apiBody {Number} [divisionId] Идентификатор подразделения, к которому привязан пользователь (опционально, целое число или `null`).
 * @apiBody {String} password Пароль пользователя (хранится в зашифрованном виде в базе данных).
 * @apiSuccess {Object} user Созданный объект пользователя.
 * @apiSuccess {Number} user.id Идентификатор пользователя.
 * @apiSuccess {String} user.name Имя пользователя.
 * @apiSuccess {String} user.email Электронная почта пользователя.
 * @apiSuccess {String} [user.phone] Номер телефона пользователя.
 * @apiSuccess {Number} [user.divisionId] Идентификатор подразделения.
 * @apiError (400) BadRequest Ошибка, если переданы некорректные данные (например, email уже существует, отсутствует обязательное поле или `divisionId` невалиден).
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Электронная почта уже существует"
 *     }
 * @apiExample {curl} Пример использования:
 *     curl -X POST -H "Content-Type: application/json" -d '{"name":"Иван Иванов","email":"ivan@example.com","phone":"1234567890","divisionId":1,"password":"secure123"}' http://217.114.10.226:5000/api/users
 */
router.post('/', async (req, res) => {
  const { name, email, phone, divisionId, password, username } = req.body;
  try {
    const divisionIds = Array.isArray(req.body?.divisionIds) ? req.body.divisionIds.map((v) => parseInt(v)).filter(Boolean) : [];
    const primary = divisionId ? parseInt(divisionId) : (divisionIds[0] ?? null);
    const user = await req.prisma.user.create({
      data: { name, email, phone, password, username: username || null, divisionId: primary },
    });
    try {
      const extras = divisionIds.filter((v) => v && v !== primary);
      for (const d of extras) {
        try { await req.prisma.$executeRawUnsafe('INSERT INTO "UserExtraDivision" ("userId", "divisionId") VALUES ($1, $2) ON CONFLICT DO NOTHING', user.id, d); } catch {}
      }
      console.log('[POST /api/users] saved extras', { userId: user.id, primary, extras });
    } catch (e) { console.log('[POST /api/users] extras error', e?.message || e); }
    res.json(user);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {put} /api/users/:id Обновление данных пользователя
 * @apiName ОбновлениеПользователя
 * @apiGroup Пользователи
 * @apiDescription Обновляет данные существующего пользователя по его идентификатору. Позволяет изменить имя, email, телефон, подразделение или пароль. Все поля опциональны, обновляются только переданные в теле запроса.
 * @apiParam {Number} id Идентификатор пользователя (параметр пути). Должен быть целым числом, соответствующим записи в таблице `User`.
 * @apiBody {String} [name] Новое имя пользователя (опционально).
 * @apiBody {String} [email] Новый адрес электронной почты (опционально, должен быть уникальным).
 * @apiBody {String} [phone] Новый номер телефона (опционально, может быть `null`).
 * @apiBody {Number} [divisionId] Новый идентификатор подразделения (опционально, целое число или `null`).
 * @apiBody {String} [password] Новый пароль пользователя (опционально).
 * @apiSuccess {Object} user Обновлённый объект пользователя.
 * @apiSuccess {Number} user.id Идентификатор пользователя.
 * @apiSuccess {String} user.name Имя пользователя.
 * @apiSuccess {String} user.email Электронная почта пользователя.
 * @apiSuccess {String} [user.phone] Номер телефона пользователя.
 * @apiSuccess {Number} [user.divisionId] Идентификатор подразделения.
 * @apiError (400) BadRequest Ошибка, если пользователь с указанным `id` не найден, переданы некорректные данные (например, email уже используется) или `divisionId` невалиден.
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Пользователь не найден"
 *     }
 * @apiExample {curl} Пример использования:
 *     curl -X PUT -H "Content-Type: application/json" -d '{"name":"Иван Петров","email":"petrov@example.com"}' http://217.114.10.226:5000/api/users/26
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, divisionId, divisionIds, password, username } = req.body;
  try {
    const user = await req.prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        username: username === undefined ? undefined : (username || null),
        divisionId: divisionId ? parseInt(divisionId) : null,
        password: password || undefined,
      },
    });
    try {
      const ids = Array.isArray(divisionIds) ? divisionIds.map((v) => parseInt(v)).filter(Boolean) : [];
      const primary = divisionId ? parseInt(divisionId) : null;
      const extras = ids.filter((v) => v && v !== primary);
      await req.prisma.$executeRawUnsafe('DELETE FROM "UserExtraDivision" WHERE "userId" = $1', user.id);
      for (const d of extras) {
        try { await req.prisma.$executeRawUnsafe('INSERT INTO "UserExtraDivision" ("userId", "divisionId") VALUES ($1, $2) ON CONFLICT DO NOTHING', user.id, d); } catch {}
      }
      console.log('[PUT /api/users/:id] saved extras', { userId: user.id, primary, extras });
    } catch (e) { console.log('[PUT /api/users/:id] extras error', e?.message || e); }
    res.json(user);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {delete} /api/users/:id Удаление пользователя
 * @apiName УдалениеПользователя
 * @apiGroup Пользователи
 * @apiDescription Удаляет пользователя из системы по его идентификатору. Используется для удаления учётной записи, например, при увольнении сотрудника или исключении участника.
 * @apiParam {Number} id Идентификатор пользователя (параметр пути). Должен быть целым числом, соответствующим записи в таблице `User`.
 * @apiSuccess {Boolean} success Статус операции. Возвращает `true`, если пользователь успешно удалён.
 * @apiError (400) BadRequest Ошибка, если пользователь с указанным `id` не найден.
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Пользователь не найден"
 *     }
 * @apiExample {curl} Пример использования:
 *     curl -X DELETE http://217.114.10.226:5000/api/users/26
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await req.prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {get} /api/users/:id Получение данных пользователя
 * @apiName ПолучениеПользователя
 * @apiGroup Пользователи
 * @apiDescription Возвращает данные конкретного пользователя по его ID, включая статус isBadgeInserted
 * @apiParam {Number} id Идентификатор пользователя (параметр пути)
 * @apiSuccess {Object} user Объект пользователя
 * @apiSuccess {Number} user.id Идентификатор пользователя
 * @apiSuccess {String} user.name Имя пользователя
 * @apiSuccess {String} user.email Электронная почта
 * @apiSuccess {Boolean} user.isOnline Статус онлайн
 * @apiSuccess {Boolean} user.isBadgeInserted Статус вставленной карточки Televic
 * @apiError (404) NotFound Пользователь не найден
 * @apiExample {curl} Пример использования:
 *     curl http://217.114.10.226:5000/api/users/2
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        isBadgeInserted: true,
        division: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = (prisma) => {
  router.prisma = prisma;
  return router;
};
