const express = require('express');
const router = express.Router();

/**
 * @api {get} /api/meetings/:id/agenda-items Получение списка элементов повестки  для заседания
 * @apiName ПолучениеЭлементовПовестки
 * @apiGroup Повестка
 * @apiDescription Возвращает список всех элементов повестки , связанных с указанным заседанием, упорядоченных по номеру (`number`). Используется для отображения повестки  в интерфейсе администратора или участника заседания. Каждый элемент включает информацию о докладчике, если он назначен.
 * @apiParam {Number} id Идентификатор заседания (параметр пути). Должен быть целым числом, соответствующим записи в таблице `Meeting` базы данных.
 * @apiSuccess {Object[]} agendaItems Массив объектов элементов повестки .
 * @apiSuccess {Number} agendaItems.id Идентификатор элемента повестки.
 * @apiSuccess {Number} agendaItems.number Порядковый номер элемента в повестке.
 * @apiSuccess {String} agendaItems.title Название или описание элемента повестки (например, "Обсуждение бюджета").
 * @apiSuccess {Number} [agendaItems.speakerId] Идентификатор докладчика (пользователя), если назначен, или `null`.
 * @apiSuccess {String} agendaItems.speaker Имя докладчика или строка `"Нет"`, если докладчик не назначен.
 * @apiSuccess {String} [agendaItems.link] Ссылка на материалы или документы, связанные с элементом повестки (может быть `null`).
 * @apiSuccess {Boolean} agendaItems.voting Указывает, активно ли голосование по этому элементу (`true` или `false`).
 * @apiSuccess {Boolean} agendaItems.completed Указывает, завершён ли элемент повестки (`true` или `false`).
 * @apiSuccess {Boolean} agendaItems.activeIssue Указывает, является ли элемент текущим активным вопросом (`true` или `false`).
 * @apiError (500) ServerError Ошибка сервера или базы данных, например, при сбое подключения к PostgreSQL или неверном `id` заседания.
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Внутренняя ошибка сервера"
 *     }
 * @apiExample {curl} Пример использования:
 *     curl http://217.114.10.226:5000/api/meetings/119/agenda-items
 */
router.get('/meetings/:id/agenda-items', async (req, res) => {
  const { id } = req.params;
  try {
    const agendaItems = await req.prisma.agendaItem.findMany({
      where: { meetingId: parseInt(id) },
      include: { speaker: true },
      orderBy: { number: 'asc' },
    });
    res.json(agendaItems.map(item => ({
      id: item.id,
      number: item.number,
      title: item.title,
      speakerId: item.speakerId,
      speaker: item.speaker ? item.speaker.name : 'Нет',
      link: item.link,
      voting: item.voting,
      completed: item.completed,
      activeIssue: item.activeIssue,
    })));
  } catch (error) {
    console.error('Error fetching agenda items:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {post} /api/meetings/:id/agenda-items Создание нового элемента повестки 
 * @apiName СозданиеЭлементаПовестки
 * @apiGroup Повестка
 * @apiDescription Создаёт новый элемент повестки  для указанного заседания. Используется для добавления вопросов или тем, которые будут обсуждаться на заседании. Обязательные поля: `number`, `title`.
 * @apiParam {Number} id Идентификатор заседания (параметр пути). Должен быть целым числом, соответствующим записи в таблице `Meeting`.
 * @apiBody {Number} number Порядковый номер элемента в повестке (целое число, например, 1, 2, 3).
 * @apiBody {String} title Название или описание элемента повестки (например, "Обсуждение бюджета").
 * @apiBody {Number} [speakerId] Идентификатор докладчика (пользователя), если назначен (опционально, целое число или `null`).
 * @apiBody {String} [link] Ссылка на материалы или документы, связанные с элементом повестки (опционально, может быть `null`).
 * @apiSuccess {Object} agendaItem Созданный объект элемента повестки.
 * @apiSuccess {Number} agendaItem.id Идентификатор элемента повестки.
 * @apiSuccess {Number} agendaItem.number Порядковый номер элемента.
 * @apiSuccess {String} agendaItem.title Название элемента.
 * @apiSuccess {Number} [agendaItem.speakerId] Идентификатор докладчика или `null`.
 * @apiSuccess {String} [agendaItem.link] Ссылка на материалы или `null`.
 * @apiSuccess {Boolean} agendaItem.voting Статус голосования (`false` по умолчанию).
 * @apiSuccess {Boolean} agendaItem.completed Статус завершения (`false` по умолчанию).
 * @apiSuccess {Number} agendaItem.meetingId Идентификатор заседания.
 * @apiSuccess {Date} agendaItem.createdAt Дата создания элемента.
 * @apiSuccess {Date} agendaItem.updatedAt Дата последнего обновления.
 * @apiError (400) BadRequest Ошибка, если переданы некорректные данные (например, отсутствуют `number` или `title`, или `meetingId` не существует).
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Некорректные данные или заседание не найдено"
 *     }
 * @apiExample {curl} Пример запроса:
 *     curl -X POST -H "Content-Type: application/json" -d '{"number":5,"title":"Новый вопрос","speakerId":26,"link":"https://example.com/doc"}' http://217.178.10.226:5000/api/meetings/119/agenda-items
 */
router.post('/meetings/:id/agenda-items', async (req, res) => {
  const { id } = req.params;
  const { number, title, speakerId, link, speakerName } = req.body;
  console.log(`Adding agenda item:`, req.body);
  try {
    const agendaItem = await req.prisma.agendaItem.create({
      data: {
        meetingId: parseInt(id),
        number,
        title,
        speakerId: speakerId ? parseInt(speakerId) : null,
        speakerName: speakerName || null,
        link,
        voting: false,
        completed: false,
      },
    });

    // Если заседание создано в CoCon - добавить вопрос и туда
    const meeting = await req.prisma.meeting.findUnique({
      where: { id: parseInt(id) },
      select: { televicMeetingId: true }
    });

    if (meeting?.televicMeetingId && router.io) {
      try {
        console.log(`[Agenda] Adding question to CoCon: number=${agendaItem.number}, title="${agendaItem.title}"`);

        // Find connector socket
        const coconNS = router.io.of('/cocon-connector');
        let socket = null;
        for (const [sid, sock] of coconNS.sockets) {
          socket = sock;
          break;
        }

        if (socket) {
          socket.emit('server:command:exec', {
            id: require('crypto').randomUUID(),
            type: 'AddQuestionInAgenda',
            payload: {
              Number: agendaItem.number,
              Name: agendaItem.title,
              Description: agendaItem.speakerName || ''
            }
          });
          console.log(`[Agenda] Command sent to CoCon connector`);
        } else {
          console.log(`[Agenda] No CoCon connector online - skipping`);
        }
      } catch (e) {
        console.error('[Agenda] Failed to add question to CoCon:', e.message);
        // Не останавливаем выполнение - продолжаем работу даже если коннектор недоступен
      }
    }

    res.json(agendaItem);
  } catch (error) {
    console.error('Error adding agenda item:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {put} /api/meetings/:id/agenda-items/:itemId Обновление элемента повестки 
 * @apiName ОбновлениеЭлементаПовестки
 * @apiGroup Повестка
 * @apiDescription Обновляет существующий элемент повестки  для указанного заседания. Позволяет изменить номер, название, докладчика, ссылку, статус активности вопроса (`activeIssue`) или завершения (`completed`). Если обновляется `activeIssue` на `true`, все другие элементы повестки для этого заседания автоматически становятся неактивными (`activeIssue: false`).
 * @apiParam {Number} id Идентификатор заседания (параметр пути). Должен быть целым числом, соответствующим записи в `Meeting`.
 * @apiParam {Number} itemId Идентификатор элемента повестки (параметр пути). Должен быть целым числом, соответствующим записи в `AgendaItem`.
 * @apiBody {Number} number Порядковый номер элемента в повестке (целое число).
 * @apiBody {String} title Название или описание элемента повестки.
 * @apiBody {Number} [speakerId] Идентификатор докладчика (пользователя), если назначен (опционально, целое число или `null`).
 * @apiBody {String} [link] Ссылка на материалы (опционально, может быть `null`).
 * @apiBody {Boolean} [activeIssue] Указывает, является ли элемент активным вопросом (опционально, `true` или `false`).
 * @apiBody {Boolean} [completed] Указывает, завершён ли элемент (опционально, `true` или `false`).
 * @apiSuccess {Object} agendaItem Обновлённый объект элемента повестки.
 * @apiSuccess {Number} agendaItem.id Идентификатор элемента повестки.
 * @apiSuccess {Number} agendaItem.number Порядковый номер элемента.
 * @apiSuccess {String} agendaItem.title Название элемента.
 * @apiSuccess {Number} [agendaItem.speakerId] Идентификатор докладчика или `null`.
 * @apiSuccess {String} [agendaItem.link] Ссылка или `null`.
 * @apiSuccess {Boolean} agendaItem.voting Статус голосования.
 * @apiSuccess {Boolean} agendaItem.completed Статус завершения.
 * @apiSuccess {Boolean} agendaItem.activeIssue Статус активности вопроса.
 * @apiSuccess {Number} agendaItem.meetingId Идентификатор заседания.
 * @apiSuccess {Date} agendaItem.createdAt Дата создания.
 * @apiSuccess {Date} agendaItem.updatedAt Дата обновления.
 * @apiError (400) BadRequest Ошибка, если элемент или заседание не найдены, или переданы некорректные данные.
 * @apiError (500) ServerError Ошибка сервера при сбое транзакции.
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Элемент повестки не найден"
 *     }
 * @apiExample {curl} Пример запроса:
 *     curl -X PUT -H "Content-Type: application/json" -d '{"number":5,"title":"Обновлённый вопрос","speakerId":26,"activeIssue":true}' http://217.178.10.226:5000/api/meetings/119/agenda-items/560
 */
router.put('/meetings/:id/agenda-items/:itemId', async (req, res) => {
  const { id, itemId } = req.params;
  const { number, title, speakerId, link, activeIssue, completed } = req.body;
  console.log(`Updating agenda item ${itemId} for meeting ${id}:`, req.body);
  try {
    const result = await req.prisma.$transaction([
      req.prisma.agendaItem.updateMany({
        where: {
          meetingId: parseInt(id),
          id: { not: parseInt(itemId) },
        },
        data: {
          activeIssue: false,
        },
      }),
      req.prisma.agendaItem.update({
        where: { id: parseInt(itemId), meetingId: parseInt(id) },
        data: {
          number,
          title,
          speakerId: speakerId ? parseInt(speakerId) : null,
          link,
          activeIssue: activeIssue !== undefined ? activeIssue : undefined,
          completed: completed !== undefined ? completed : undefined,
        },
      }),
    ]);

    // Если устанавливается активный вопрос - отправить команду в CoCon через коннектор
    if (activeIssue === true && router.io) {
      try {
        const updatedItem = result[1];
        console.log(`[Agenda] Setting active question in CoCon: number=${updatedItem.number}`);

        // Find connector socket
        const coconNS = router.io.of('/cocon-connector');
        let socket = null;
        for (const [sid, sock] of coconNS.sockets) {
          socket = sock;
          break;
        }

        if (socket) {
          socket.emit('server:command:exec', {
            id: require('crypto').randomUUID(),
            type: 'SetCurrentQuestionInAgenda',
            payload: {
              number: updatedItem.number,
              id: updatedItem.number
            }
          });
          console.log(`[Agenda] Command sent to CoCon connector`);
        } else {
          console.log(`[Agenda] No CoCon connector online - skipping`);
        }
      } catch (e) {
        console.error('[Agenda] Failed to send SetCurrentQuestionInAgenda command:', e.message);
        // Не останавливаем выполнение - продолжаем работу даже если коннектор недоступен
      }
    }

    res.json(result[1]);
  } catch (error) {
    console.error('Error updating agenda item:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {delete} /api/meetings/:id/agenda-items/:itemId Удаление элемента повестки 
 * @apiName УдалениеЭлементаПовестки
 * @apiGroup Повестка
 * @apiDescription Удаляет элемент повестки  по его идентификатору для указанного заседания. Используется для исключения вопросов из повестки. Перед удалением проверяется существование элемента.
 * @apiParam {Number} id Идентификатор заседания (параметр пути). Должен быть целым числом, соответствующим записи в `Meeting`.
 * @apiParam {Number} itemId Идентификатор элемента повестки (параметр пути). Должен быть целым числом, соответствующим записи в `AgendaItem`.
 * @apiSuccess {Boolean} success Статус операции. Возвращает `true`, если элемент успешно удалён.
 * @apiError (404) NotFound Ошибка, если элемент повестки или заседание не найдены.
 * @apiError (400) BadRequest Ошибка, если произошёл сбой при удалении (например, из-за связанных данных).
 * @apiErrorExample {json} Пример ответа при ошибке:
 *     {
 *         "error": "Элемент повестки не найден"
 *     }
 * @apiExample {curl} Пример запроса:
 *     curl -X DELETE http://217.178.10.226:5000/api/meetings/119/agenda-items/560
 */
router.delete('/meetings/:id/agenda-items/:itemId', async (req, res) => {
  const { id, itemId } = req.params;
  console.log(`Deleting agenda item ${itemId} for meeting ${id}`);
  try {
    const agendaItem = await req.prisma.agendaItem.findUnique({
      where: { id: parseInt(itemId), meetingId: parseInt(id) },
    });
    if (!agendaItem) {
      return res.status(404).json({ error: 'Agenda item not found' });
    }
    await req.prisma.agendaItem.delete({
      where: { id: parseInt(itemId), meetingId: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting agenda item:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @api {get} /api/agenda-items/:id/detailed-votes Получение детальных данных голосований по вопросу повестки
 * @apiName ПолучениеДетальныхГолосований
 * @apiGroup Повестка
 * @apiDescription Возвращает все голосования (voteResults) для указанного вопроса повестки с детальной информацией о каждом голосе (votes), информацией о заседании и участниках. Используется для генерации детального PDF отчёта.
 * @apiParam {Number} id Идентификатор вопроса повестки (параметр пути).
 * @apiSuccess {Object} agendaItem Объект вопроса повестки.
 * @apiSuccess {Object} meeting Объект заседания с подразделениями.
 * @apiSuccess {Object[]} voteResults Массив результатов голосований с индивидуальными голосами.
 * @apiSuccess {Object[]} participants Массив всех участников заседания из подразделений.
 * @apiSuccess {Number} voteResults.votesFor Количество голосов "За".
 * @apiSuccess {Number} voteResults.votesAgainst Количество голосов "Против".
 * @apiSuccess {Number} voteResults.votesAbstain Количество голосов "Воздержались".
 * @apiSuccess {Number} voteResults.votesAbsent Количество не проголосовавших.
 * @apiSuccess {String} voteResults.decision Решение ("Принято" или "Не принято").
 * @apiSuccess {String} voteResults.voteStatus Статус голосования (PENDING, ENDED, APPLIED, CANCELLED).
 * @apiSuccess {String} voteResults.voteType Тип голосования (OPEN или CLOSED).
 * @apiSuccess {Date} voteResults.createdAt Дата начала голосования.
 * @apiSuccess {Number} voteResults.duration Длительность голосования в секундах.
 * @apiSuccess {Object[]} voteResults.votes Массив голосов участников.
 * @apiSuccess {Number} voteResults.votes.userId Идентификатор пользователя.
 * @apiSuccess {String} voteResults.votes.choice Выбор пользователя (FOR, AGAINST, ABSTAIN).
 * @apiSuccess {Object} voteResults.votes.user Данные пользователя.
 * @apiSuccess {String} voteResults.votes.user.name Имя пользователя.
 * @apiError (404) NotFound Вопрос повестки не найден.
 * @apiError (500) ServerError Ошибка сервера.
 * @apiExample {curl} Пример запроса:
 *     curl http://217.114.10.226:5000/api/agenda-items/280/detailed-votes
 */
router.get('/agenda-items/:id/detailed-votes', async (req, res) => {
  const { id } = req.params;
  const agendaItemId = parseInt(id, 10);

  if (!agendaItemId || isNaN(agendaItemId)) {
    return res.status(400).json({ error: 'Invalid agenda item ID' });
  }

  try {
    // Get agenda item with meeting and divisions
    const agendaItem = await req.prisma.agendaItem.findUnique({
      where: { id: agendaItemId },
      include: {
        meeting: {
          include: {
            divisions: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!agendaItem) {
      return res.status(404).json({ error: 'Agenda item not found' });
    }

    // Collect all unique users from divisions
    const userMap = new Map();
    agendaItem.meeting.divisions.forEach(div => {
      div.users.forEach(user => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, user);
        }
      });
    });
    const participants = Array.from(userMap.values());

    // Get all vote results for this agenda item
    const voteResults = await req.prisma.voteResult.findMany({
      where: { agendaItemId },
      orderBy: { createdAt: 'asc' },
    });

    // For each vote result, get individual votes with user info
    const detailedResults = await Promise.all(
      voteResults.map(async (voteResult) => {
        const votes = await req.prisma.vote.findMany({
          where: { voteResultId: voteResult.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return {
          ...voteResult,
          votes,
        };
      })
    );

    console.log(`[API] Found ${voteResults.length} vote results for agenda item ${agendaItemId}`);

    res.json({
      agendaItem,
      meeting: agendaItem.meeting,
      voteResults: detailedResults,
      participants,
    });
  } catch (error) {
    console.error(`[API] Error fetching detailed votes for agenda item ${agendaItemId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = (prisma, pgClient, io) => {
  router.prisma = prisma;
  router.io = io;
  return router;
};