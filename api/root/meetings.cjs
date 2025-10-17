const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (prisma, pgClient, io) => {
  /**
   * @api {get} /api/meetings РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° РІСЃРµС… РЅРµР°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№
   * @apiName РџРѕР»СѓС‡РµРЅРёРµРќРµР°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С…Р—Р°СЃРµРґР°РЅРёР№
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ СЃРїРёСЃРѕРє РІСЃРµС… РЅРµР°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№ СЃ РёРЅС„РѕСЂРјР°С†РёРµР№ Рѕ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏС…. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ Р°РєС‚РёРІРЅС‹С… РёР»Рё РїСЂРµРґСЃС‚РѕСЏС‰РёС… Р·Р°СЃРµРґР°РЅРёР№ РІ РёРЅС‚РµСЂС„РµР№СЃРµ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР° РёР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
   * @apiSuccess {Object[]} meetings РњР°СЃСЃРёРІ РѕР±СЉРµРєС‚РѕРІ Р·Р°СЃРµРґР°РЅРёР№.
   * @apiSuccess {Number} meetings.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (СѓРЅРёРєР°Р»СЊРЅС‹Р№ РєР»СЋС‡ Р·Р°РїРёСЃРё РІ С‚Р°Р±Р»РёС†Рµ `Meeting`).
   * @apiSuccess {String} meetings.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ (РЅР°РїСЂРёРјРµСЂ, "РЎРѕРІРµС‰Р°РЅРёРµ РїРѕ Р±СЋРґР¶РµС‚Сѓ").
   * @apiSuccess {String} meetings.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р° Р·Р°СЃРµРґР°РЅРёСЏ РІ С„РѕСЂРјР°С‚Рµ ISO (РЅР°РїСЂРёРјРµСЂ, "2025-06-03T10:00:00.000Z").
   * @apiSuccess {String} meetings.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ Р·Р°СЃРµРґР°РЅРёСЏ РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meetings.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (`WAITING`, `IN_PROGRESS`, `COMPLETED`).
   * @apiSuccess {String} meetings.divisions РќР°Р·РІР°РЅРёСЏ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№, РѕР±СЉРµРґРёРЅС‘РЅРЅС‹Рµ С‡РµСЂРµР· Р·Р°РїСЏС‚СѓСЋ, РёР»Рё `"РќРµС‚"`, РµСЃР»Рё РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚.
   * @apiSuccess {Boolean} meetings.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (РІСЃРµРіРґР° `false` РґР»СЏ СЌС‚РѕРіРѕ РјР°СЂС€СЂСѓС‚Р°).
   * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С…, РЅР°РїСЂРёРјРµСЂ, РїСЂРё СЃР±РѕРµ РїРѕРґРєР»СЋС‡РµРЅРёСЏ Рє PostgreSQL.
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ:
   *     {
   *         "error": "Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl http://217.114.10.226:5000/api/meetings
   */
  router.get('/', async (req, res) => {
    try {
      const meetings = await prisma.meeting.findMany({
        where: { isArchived: false },
        include: { divisions: true, agendaItems: true },
      });
      console.log('Fetched meetings on frontend:', meetings);

      // Helper function to check if division is system "Приглашенные"
      const isReservedName = (name) => {
        try {
          if (!name || typeof name !== 'string') return false;
          const n = name.replace(/👥/g, '').trim().toLowerCase();
          return n === 'приглашенные';
        } catch {
          return false;
        }
      };

      res.json(meetings.map(meeting => ({
        id: meeting.id,
        name: meeting.name,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        status: meeting.status,
        divisions: meeting.divisions.map(d => isReservedName(d.name) ? '👥Приглашенные' : d.name).join(', ') || 'РќРµС‚',
        isArchived: meeting.isArchived,
        televicMeetingId: meeting.televicMeetingId || null,
        createInTelevic: meeting.createInTelevic || false, // Show T badge based on this flag
      })));
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° Р·Р°СЃРµРґР°РЅРёР№:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {get} /api/meetings/archived РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° РІСЃРµС… Р°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№
   * @apiName РџРѕР»СѓС‡РµРЅРёРµРђСЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С…Р—Р°СЃРµРґР°РЅРёР№
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ СЃРїРёСЃРѕРє РІСЃРµС… Р°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№ СЃ РёРЅС„РѕСЂРјР°С†РёРµР№ Рѕ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏС…. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ Р·Р°РІРµСЂС€С‘РЅРЅС‹С… РёР»Рё СѓСЃС‚Р°СЂРµРІС€РёС… Р·Р°СЃРµРґР°РЅРёР№ РІ РёРЅС‚РµСЂС„РµР№СЃРµ.
   * @apiSuccess {Object[]} meetings РњР°СЃСЃРёРІ РѕР±СЉРµРєС‚РѕРІ Р·Р°СЃРµРґР°РЅРёР№.
   * @apiSuccess {Number} meetings.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meetings.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meetings.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р° Р·Р°СЃРµРґР°РЅРёСЏ РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meetings.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ Р·Р°СЃРµРґР°РЅРёСЏ РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meetings.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (`WAITING`, `IN_PROGRESS`, `COMPLETED`).
   * @apiSuccess {String} meetings.divisions РќР°Р·РІР°РЅРёСЏ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№, РѕР±СЉРµРґРёРЅС‘РЅРЅС‹Рµ С‡РµСЂРµР· Р·Р°РїСЏС‚СѓСЋ, РёР»Рё `"РќРµС‚"`.
   * @apiSuccess {Boolean} meetings.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (РІСЃРµРіРґР° `true` РґР»СЏ СЌС‚РѕРіРѕ РјР°СЂС€СЂСѓС‚Р°).
   * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ:
   *     {
   *         "error": "Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl http://217.114.10.226:5000/api/meetings/archived
   */
  router.get('/archived', async (req, res) => {
    try {
      const meetings = await prisma.meeting.findMany({
        where: { isArchived: true },
        include: { divisions: true, agendaItems: true },
      });
      console.log('Fetched archived meetings:', meetings);

      // Helper function to check if division is system "Приглашенные"
      const isReservedName = (name) => {
        try {
          if (!name || typeof name !== 'string') return false;
          const n = name.replace(/👥/g, '').trim().toLowerCase();
          return n === 'приглашенные';
        } catch {
          return false;
        }
      };

      res.json(meetings.map(meeting => ({
        id: meeting.id,
        name: meeting.name,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        status: meeting.status,
        divisions: meeting.divisions.map(d => isReservedName(d.name) ? '👥Приглашенные' : d.name).join(', ') || 'РќРµС‚',
        isArchived: meeting.isArchived,
        televicMeetingId: meeting.televicMeetingId || null,
        createInTelevic: meeting.createInTelevic || false, // Show T badge based on this flag
      })));
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° Р°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {get} /api/meetings/active-for-user РџРѕР»СѓС‡РµРЅРёРµ Р°РєС‚РёРІРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
   * @apiName РџРѕР»СѓС‡РµРЅРёРµРђРєС‚РёРІРЅС‹С…Р—Р°СЃРµРґР°РЅРёР№РџРѕР»СЊР·РѕРІР°С‚РµР»СЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ СЃРїРёСЃРѕРє Р°РєС‚РёРІРЅС‹С… (РЅРµР°СЂС…РёРІРёСЂРѕРІР°РЅРЅС‹С…) Р·Р°СЃРµРґР°РЅРёР№, РІ РєРѕС‚РѕСЂС‹С… СѓС‡Р°СЃС‚РІСѓРµС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ, РѕРїСЂРµРґРµР»С‘РЅРЅС‹Р№ РїРѕ РµРіРѕ email. Р—Р°СЃРµРґР°РЅРёСЏ РІРєР»СЋС‡Р°СЋС‚ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РїРѕРІРµСЃС‚РєРµ, РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏС… Рё СѓС‡Р°СЃС‚РЅРёРєР°С…. РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃС‡РёС‚Р°РµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј, РµСЃР»Рё РµРіРѕ РїРѕРґСЂР°Р·РґРµР»РµРЅРёРµ СЃРІСЏР·Р°РЅРѕ СЃ Р·Р°СЃРµРґР°РЅРёРµРј.
   * @apiQuery {String} email Р­Р»РµРєС‚СЂРѕРЅРЅР°СЏ РїРѕС‡С‚Р° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, РЅР°РїСЂРёРјРµСЂ, "user@example.com").
   * @apiSuccess {Object[]} meetings РњР°СЃСЃРёРІ РѕР±СЉРµРєС‚РѕРІ Р·Р°СЃРµРґР°РЅРёР№.
   * @apiSuccess {Number} meetings.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meetings.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meetings.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р° РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meetings.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meetings.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (`WAITING`, `IN_PROGRESS`, `COMPLETED`).
   * @apiSuccess {Boolean} meetings.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (РІСЃРµРіРґР° `false`).
   * @apiSuccess {Object[]} meetings.agendaItems РњР°СЃСЃРёРІ СЌР»РµРјРµРЅС‚РѕРІ РїРѕРІРµСЃС‚РєРё.
   * @apiSuccess {Number} meetings.agendaItems.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЌР»РµРјРµРЅС‚Р° РїРѕРІРµСЃС‚РєРё.
   * @apiSuccess {Number} meetings.agendaItems.number РџРѕСЂСЏРґРєРѕРІС‹Р№ РЅРѕРјРµСЂ РІРѕРїСЂРѕСЃР°.
   * @apiSuccess {String} meetings.agendaItems.title РќР°Р·РІР°РЅРёРµ РІРѕРїСЂРѕСЃР°.
   * @apiSuccess {String} meetings.agendaItems.speaker РРјСЏ РґРѕРєР»Р°РґС‡РёРєР° РёР»Рё `"РќРµС‚"`.
   * @apiSuccess {String} [meetings.agendaItems.link] РЎСЃС‹Р»РєР° РЅР° РјР°С‚РµСЂРёР°Р»С‹ (РјРѕР¶РµС‚ Р±С‹С‚СЊ `null`).
   * @apiSuccess {Boolean} meetings.agendaItems.voting РЎС‚Р°С‚СѓСЃ РіРѕР»РѕСЃРѕРІР°РЅРёСЏ.
   * @apiSuccess {Boolean} meetings.agendaItems.completed РЎС‚Р°С‚СѓСЃ Р·Р°РІРµСЂС€РµРЅРёСЏ.
   * @apiSuccess {Boolean} meetings.agendaItems.activeIssue РЎС‚Р°С‚СѓСЃ Р°РєС‚РёРІРЅРѕСЃС‚Рё РІРѕРїСЂРѕСЃР°.
   * @apiSuccess {Object[]} meetings.divisions РњР°СЃСЃРёРІ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№.
   * @apiSuccess {Number} meetings.divisions.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ.
   * @apiSuccess {String} meetings.divisions.name РќР°Р·РІР°РЅРёРµ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ.
   * @apiSuccess {Object[]} meetings.divisions.users РџРѕР»СЊР·РѕРІР°С‚РµР»Рё РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ.
   * @apiSuccess {Number} meetings.divisions.users.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
   * @apiSuccess {String} meetings.divisions.users.name РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
   * @apiSuccess {String} meetings.divisions.users.email Р­Р»РµРєС‚СЂРѕРЅРЅР°СЏ РїРѕС‡С‚Р° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
   * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ СѓРєР°Р·Р°РЅРЅС‹Рј email РЅРµ РЅР°Р№РґРµРЅ.
   * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
   *     {
   *         "error": "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl http://217.114.10.226:5000/api/meetings/active-for-user?email=1@1.ru
   */
  router.get('/active-for-user', async (req, res) => {
    const { email } = req.query;
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { division: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const meetings = await prisma.meeting.findMany({
        where: {
          isArchived: false,
        },
        include: {
          divisions: {
            include: { users: true },
          },
        },
      });

      const userMeetings = meetings.filter(meeting =>
        meeting.divisions.some(division => division.id === user.divisionId)
      );

      const meetingsWithAgenda = await Promise.all(
        userMeetings.map(async (meeting) => {
          const agendaItems = await prisma.agendaItem.findMany({
            where: { meetingId: meeting.id },
            include: { speaker: true },
            orderBy: { number: 'asc' },
          });
          return {
            ...meeting,
            agendaItems: agendaItems.map(item => ({
              id: item.id,
              number: item.number,
              title: item.title,
              speaker: item.speaker ? item.speaker.name : 'РќРµС‚',
              link: item.link,
              voting: item.voting,
              completed: item.completed,
              activeIssue: item.activeIssue,
            })),
            divisions: meeting.divisions.map(division => ({
              id: division.id,
              name: division.name,
              users: division.users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
              })),
            })),
          };
        })
      );

      console.log('Agenda items response:', JSON.stringify(meetingsWithAgenda, null, 2));
      res.json(meetingsWithAgenda);
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё Р°РєС‚РёРІРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {get} /api/meetings/:id РџРѕР»СѓС‡РµРЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ РїРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂСѓ
   * @apiName РџРѕР»СѓС‡РµРЅРёРµР—Р°СЃРµРґР°РЅРёСЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РєРѕРЅРєСЂРµС‚РЅРѕРј Р·Р°СЃРµРґР°РЅРёРё РїРѕ РµРіРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂСѓ, РІРєР»СЋС‡Р°СЏ СЃРІСЏР·Р°РЅРЅС‹Рµ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ Рё СЃС‚Р°С‚РёСЃС‚РёРєСѓ СѓС‡Р°СЃС‚РЅРёРєРѕРІ. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РґРµС‚Р°Р»РµР№ Р·Р°СЃРµРґР°РЅРёСЏ РІ РёРЅС‚РµСЂС„РµР№СЃРµ.
   * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ, СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ `id` РІ С‚Р°Р±Р»РёС†Рµ `Meeting`).
   * @apiSuccess {Object} meeting РћР±СЉРµРєС‚ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Number} meeting.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р° РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meeting.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ РІ С„РѕСЂРјР°С‚Рµ ISO.
   * @apiSuccess {String} meeting.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (`WAITING`, `IN_PROGRESS`, `COMPLETED`).
   * @apiSuccess {String} meeting.divisions РќР°Р·РІР°РЅРёСЏ РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№, РѕР±СЉРµРґРёРЅС‘РЅРЅС‹Рµ С‡РµСЂРµР· Р·Р°РїСЏС‚СѓСЋ, РёР»Рё `"РќРµС‚"`.
   * @apiSuccess {Boolean} meeting.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё.
   * @apiSuccess {Number} meeting.participantsOnline РљРѕР»РёС‡РµСЃС‚РІРѕ СѓС‡Р°СЃС‚РЅРёРєРѕРІ РѕРЅР»Р°Р№РЅ (Р·Р°РіР»СѓС€РєР°, РІСЃРµРіРґР° 30).
   * @apiSuccess {Number} meeting.participantsTotal РћР±С‰РµРµ РєРѕР»РёС‡РµСЃС‚РІРѕ СѓС‡Р°СЃС‚РЅРёРєРѕРІ (Р·Р°РіР»СѓС€РєР°, РІСЃРµРіРґР° 36).
   * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ СЃ СѓРєР°Р·Р°РЅРЅС‹Рј `id` РЅРµ РЅР°Р№РґРµРЅРѕ.
   * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
   *     {
   *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl http://217.114.10.226:5000/api/meetings/119
   */
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: parseInt(id) },
        include: {
          divisions: {
            include: {
              users: true
            }
          },
          agendaItems: true
        },
      });
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Helper function to check if division is system "Приглашенные"
      const isReservedName = (name) => {
        try {
          if (!name || typeof name !== 'string') return false;
          const n = name.replace(/👥/g, '').trim().toLowerCase();
          return n === 'приглашенные';
        } catch {
          return false;
        }
      };

      // Process divisions with proper display names and include users
      const processedDivisions = (meeting.divisions || []).map(d => ({
        id: d.id,
        name: d.name,
        displayName: isReservedName(d.name) ? '👥Приглашенные' : d.name,
        users: d.users || []
      }));

      const response = {
        id: meeting.id,
        name: meeting.name,
        startTime: meeting.startTime.toISOString(),
        endTime: meeting.endTime.toISOString(),
        status: meeting.status,
        divisions: processedDivisions,
        divisionsText: processedDivisions.map(d => d.displayName).join(', ') || 'РќРµС‚',
        isArchived: meeting.isArchived,
        televicMeetingId: meeting.televicMeetingId || null,
        agendaItems: meeting.agendaItems.map(item => ({ id: item.id, number: item.number, title: item.title, speakerId: item.speakerId, link: item.link, voting: item.voting, completed: item.completed, activeIssue: item.activeIssue })),
      };

      console.log('🔥 GET /api/meetings/:id response:', JSON.stringify(response, null, 2));
      res.json(response);
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё Р·Р°СЃРµРґР°РЅРёСЏ:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {post} /api/meetings РЎРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ Р·Р°СЃРµРґР°РЅРёСЏ
   * @apiName РЎРѕР·РґР°РЅРёРµР—Р°СЃРµРґР°РЅРёСЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription РЎРѕР·РґР°С‘С‚ РЅРѕРІРѕРµ Р·Р°СЃРµРґР°РЅРёРµ СЃ СѓРєР°Р·Р°РЅРЅС‹РјРё РїР°СЂР°РјРµС‚СЂР°РјРё, РІРєР»СЋС‡Р°СЏ РЅР°Р·РІР°РЅРёРµ, РґР°С‚С‹, РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ Рё РїРѕРІРµСЃС‚РєСѓ. РќРѕРІРѕРµ Р·Р°СЃРµРґР°РЅРёРµ РїРѕР»СѓС‡Р°РµС‚ СЃС‚Р°С‚СѓСЃ `WAITING` Рё РЅРµ Р°СЂС…РёРІРёСЂСѓРµС‚СЃСЏ. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РїР»Р°РЅРёСЂРѕРІР°РЅРёСЏ РЅРѕРІС‹С… Р·Р°СЃРµРґР°РЅРёР№ РІ СЃРёСЃС‚РµРјРµ.
   * @apiBody {String} name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, СЃС‚СЂРѕРєР°, РЅР°РїСЂРёРјРµСЂ, "РЎРѕРІРµС‰Р°РЅРёРµ РїРѕ Р±СЋРґР¶РµС‚Сѓ").
   * @apiBody {String} startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р° Р·Р°СЃРµРґР°РЅРёСЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, СЃС‚СЂРѕРєР° РІ С„РѕСЂРјР°С‚Рµ, СЂР°СЃРїРѕР·РЅР°РІР°РµРјРѕРј `Date`, РЅР°РїСЂРёРјРµСЂ, "2025-06-03T10:00:00Z").
   * @apiBody {String} endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ Р·Р°СЃРµРґР°РЅРёСЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, СЃС‚СЂРѕРєР° РІ С„РѕСЂРјР°С‚Рµ, СЂР°СЃРїРѕР·РЅР°РІР°РµРјРѕРј `Date`).
   * @apiBody {Number[]} [divisionIds] РњР°СЃСЃРёРІ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂРѕРІ РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№, СЃРІСЏР·Р°РЅРЅС‹С… СЃ Р·Р°СЃРµРґР°РЅРёРµРј (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РјР°СЃСЃРёРІ С†РµР»С‹С… С‡РёСЃРµР», СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓСЋС‰РёС… `id` РІ С‚Р°Р±Р»РёС†Рµ `Division`).
   * @apiBody {Object[]} [agendaItems] РњР°СЃСЃРёРІ СЌР»РµРјРµРЅС‚РѕРІ РїРѕРІРµСЃС‚РєРё РґРЅСЏ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ).
   * @apiBody {Number} agendaItems.number РџРѕСЂСЏРґРєРѕРІС‹Р№ РЅРѕРјРµСЂ РІРѕРїСЂРѕСЃР° (С†РµР»РѕРµ С‡РёСЃР»Рѕ).
   * @apiBody {String} agendaItems.title РќР°Р·РІР°РЅРёРµ РІРѕРїСЂРѕСЃР° (СЃС‚СЂРѕРєР°).
   * @apiBody {Number} [agendaItems.speakerId] РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РґРѕРєР»Р°РґС‡РёРєР° (С†РµР»РѕРµ С‡РёСЃР»Рѕ, СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ `id` РІ С‚Р°Р±Р»РёС†Рµ `User`, РёР»Рё `null`).
   * @apiBody {String} [agendaItems.link] РЎСЃС‹Р»РєР° РЅР° РјР°С‚РµСЂРёР°Р»С‹ РІРѕРїСЂРѕСЃР° (СЃС‚СЂРѕРєР° РёР»Рё `null`).
   * @apiSuccess {Object} meeting РЎРѕР·РґР°РЅРЅС‹Р№ РѕР±СЉРµРєС‚ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Number} meeting.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р°.
   * @apiSuccess {String} meeting.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ.
   * @apiSuccess {String} meeting.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (`WAITING`).
   * @apiSuccess {Boolean} meeting.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (`false`).
   * @apiError (400) BadRequest РћС€РёР±РєР°, РµСЃР»Рё РїРµСЂРµРґР°РЅС‹ РЅРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ (РЅР°РїСЂРёРјРµСЂ, РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ, РЅРµРІР°Р»РёРґРЅС‹Рµ РґР°С‚С‹, РёР»Рё `divisionIds` РЅРµ СЃСѓС‰РµСЃС‚РІСѓСЋС‚).
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ:
   *     {
   *         "error": "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ С„РѕСЂРјР°С‚ РґР°С‚С‹ startTime"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl -X POST -H "Content-Type: application/json" -d '{"name":"РќРѕРІРѕРµ Р·Р°СЃРµРґР°РЅРёРµ","startTime":"2025-06-03T10:00:00Z","endTime":"2025-06-03T12:00:00Z","divisionIds":[1,2],"agendaItems":[{"number":1,"title":"Р’РѕРїСЂРѕСЃ 1","speakerId":26,"link":"https://example.com"}]}' http://217.114.10.226:5000/api/meetings
   */
  router.post('/', async (req, res) => {
    const { name, startTime, endTime, divisionIds, agendaItems, createInTelevic } = req.body;
    console.log('Received meeting data:', req.body);
    try {
      // Check if Televic connector is online when createInTelevic is requested
      if (createInTelevic && io) {
        const coconNS = io.of('/cocon-connector');
        let hasConnector = false;
        for (const [sid, sock] of coconNS.sockets) {
          hasConnector = true;
          break;
        }

        if (!hasConnector) {
          console.log('[Televic] Connector not online, rejecting meeting creation');
          return res.status(400).json({
            error: 'Не подключен коннектор!'
          });
        }
      }

      const meeting = await prisma.meeting.create({
        data: {
          name,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status: 'WAITING',
          isArchived: false,
          createInTelevic: createInTelevic || false, // Save flag for later
          divisions: {
            connect: divisionIds && Array.isArray(divisionIds) ? divisionIds.map(id => ({ id: parseInt(id) })) : [],
          },
          agendaItems: {
            create: agendaItems && Array.isArray(agendaItems) ? agendaItems.map(item => ({
              number: item.number,
              title: item.title,
              speakerId: item.speakerId ? parseInt(item.speakerId) : null,
              link: item.link || null,
              voting: false,
              completed: false,
            })) : [],
          },
        },
      });

      // NOTE: Televic meeting creation moved to "Start Meeting" button
      // The meeting will be created in Televic when user clicks "Start" on /console page
      // This allows creating meeting templates without immediately starting them in CoCon

      /* COMMENTED OUT - Will be moved to start meeting endpoint
      if (createInTelevic && io) {
        // Don't await - do it in background
        (async () => {
          try {
            // Get linked delegates from selected divisions
            const linkedUsers = await prisma.user.findMany({
              where: {
                divisionId: { in: divisionIds && Array.isArray(divisionIds) ? divisionIds.map(id => parseInt(id)) : [] },
                televicExternalId: { not: null }
              },
              select: { televicExternalId: true }
            });
            const delegateIds = linkedUsers.map(u => u.televicExternalId).filter(Boolean);

            console.log('[Televic] Creating mirror meeting for:', meeting.id, 'delegates:', delegateIds);

            // Find connector socket
            const coconNS = io.of('/cocon-connector');
            let socket = null;
            for (const [sid, sock] of coconNS.sockets) {
              socket = sock;
              break;
            }

            if (!socket) {
              console.log('[Televic] No connector online, skipping meeting creation');
              return;
            }

            // Helper to send command
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

            // Step 1: End all active meetings (Running, Paused, New)
            console.log('[Televic] Getting all meetings to check for active ones...');
            const getAllResult = await sendCommand('/Meeting_Agenda/GetAllMeetings');

            if (getAllResult.ok && getAllResult.data) {
              const allMeetingsData = getAllResult.data.data;
              const parsed = typeof allMeetingsData === 'string' ? JSON.parse(allMeetingsData) : allMeetingsData;
              const activeMeetings = parsed?.GetAllMeetings?.Meetings?.filter(m =>
                m.State === 'Running' || m.State === 'Paused' || m.State === 'New'
              ) || [];

              console.log('[Televic] Active meetings to end:', activeMeetings.map(m => `ID ${m.Id} "${m.Title}" (${m.State})`));

              // End each active meeting using SetMeetingState API
              for (const activeMeeting of activeMeetings) {
                console.log(`[Televic] Ending meeting ID ${activeMeeting.Id}...`);
                const endResult = await sendCommand('/Meeting_Agenda/SetMeetingState', {
                  State: 'Ended',
                  MeetingId: activeMeeting.Id
                });

                console.log(`[Televic] SetMeetingState result for ID ${activeMeeting.Id}:`, JSON.stringify(endResult));

                if (endResult.ok) {
                  console.log(`[Televic] Successfully ended meeting ID ${activeMeeting.Id}`);
                } else {
                  console.error(`[Televic] Failed to end meeting ID ${activeMeeting.Id}:`, endResult.error);
                }
              }
            }

            // Step 2: Create new meeting in Televic
            // Format dates: 2017/6/5 00:00:00
            const formatDate = (d) => {
              if (!d) return null;
              const dt = new Date(d);
              const pad = (n) => String(n).padStart(2, '0');
              return `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
            };

            // Ensure From time is at least 60 seconds in the future from NOW
            let fromDateTime = startTime ? new Date(startTime) : new Date();
            const now = new Date();
            const minFutureTime = new Date(now.getTime() + 60000); // +1 minute minimum

            if (fromDateTime <= minFutureTime) {
              console.log('[Televic] Warning: Start time is too close or in the past, adjusting to now + 1 minute');
              console.log('[Televic] Original time:', fromDateTime.toISOString());
              console.log('[Televic] Current time:', now.toISOString());
              fromDateTime = minFutureTime;
            }

            // Ensure To time is after From time
            let toDateTime = endTime ? new Date(endTime) : new Date(fromDateTime.getTime() + 3600000);
            if (toDateTime <= fromDateTime) {
              console.log('[Televic] Warning: End time is before start time, adjusting to start + 1 hour');
              toDateTime = new Date(fromDateTime.getTime() + 3600000); // +1 hour
            }

            const fromTime = formatDate(fromDateTime);
            const toTime = formatDate(toDateTime);

            console.log('[Televic] Meeting times - From:', fromTime, 'To:', toTime);

            const createResult = await sendCommand('/Meeting_Agenda/StartEmptyMeeting', {
              Title: name,
              From: fromTime,
              To: toTime,
              LoginMethod: 2, // Free seating, must authenticate
              AuthenticationMode: 0, // Internal
              AuthenticationType: 1  // Badge only
            });

            console.log('[Televic] Raw result:', JSON.stringify(createResult));

            if (!createResult.ok || !createResult.data) {
              console.error('[Televic] Failed to create meeting:', createResult.error || 'Unknown error');
              return;
            }

            const meetingData = createResult.data.data;
            console.log('[Televic] Meeting data type:', typeof meetingData);
            console.log('[Televic] Meeting data:', meetingData);
            const parsed = typeof meetingData === 'string' ? JSON.parse(meetingData) : meetingData;
            console.log('[Televic] Parsed data:', JSON.stringify(parsed));
            const televicMeetingId = parsed?.StartEmptyMeeting?.MeetingId || null;

            if (!televicMeetingId) {
              console.error('[Televic] No MeetingId returned');
              return;
            }

            console.log('[Televic] Created meeting ID:', televicMeetingId);

            // Add delegates
            if (delegateIds.length > 0) {
              for (const delegateId of delegateIds) {
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

            // Update database
            await prisma.meeting.update({
              where: { id: Number(meeting.id) },
              data: { televicMeetingId: Number(televicMeetingId) }
            });

            console.log('[Televic] Mirror meeting created successfully');

            // Notify all clients about the update
            io.emit('meeting:updated', {
              meetingId: Number(meeting.id),
              televicMeetingId: Number(televicMeetingId)
            });
          } catch (televicError) {
            console.error('[Televic] Failed to create mirror meeting:', televicError.message);
          }
        })();
      }
      */

      res.json(meeting);
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё СЃРѕР·РґР°РЅРёРё Р·Р°СЃРµРґР°РЅРёСЏ:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @api {put} /api/meetings/:id РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ
   * @apiName РћР±РЅРѕРІР»РµРЅРёРµР—Р°СЃРµРґР°РЅРёСЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription РћР±РЅРѕРІР»СЏРµС‚ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРµ Р·Р°СЃРµРґР°РЅРёРµ РїРѕ РµРіРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂСѓ, РІРєР»СЋС‡Р°СЏ РЅР°Р·РІР°РЅРёРµ, РґР°С‚С‹, РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ, РїРѕРІРµСЃС‚РєСѓ Рё СЃС‚Р°С‚СѓСЃ. РЈРґР°Р»СЏРµС‚ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ СЌР»РµРјРµРЅС‚С‹ РїРѕРІРµСЃС‚РєРё Рё СЃРІСЏР·Р°РЅРЅС‹Рµ РіРѕР»РѕСЃР° РїРµСЂРµРґ СЃРѕР·РґР°РЅРёРµРј РЅРѕРІС‹С…. Р’С‹РїРѕР»РЅСЏРµС‚СЃСЏ РІ С‚СЂР°РЅР·Р°РєС†РёРё РґР»СЏ РѕР±РµСЃРїРµС‡РµРЅРёСЏ С†РµР»РѕСЃС‚РЅРѕСЃС‚Рё РґР°РЅРЅС‹С….
   * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
   * @apiBody {String} name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, СЃС‚СЂРѕРєР°).
   * @apiBody {String} startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р° (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, СЃС‚СЂРѕРєР° РІ С„РѕСЂРјР°С‚Рµ, СЂР°СЃРїРѕР·РЅР°РІР°РµРјРѕРј `Date`).
   * @apiBody {String} endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, СЃС‚СЂРѕРєР° РІ С„РѕСЂРјР°С‚Рµ, СЂР°СЃРїРѕР·РЅР°РІР°РµРјРѕРј `Date`).
   * @apiBody {Number[]} [divisionIds] РњР°СЃСЃРёРІ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂРѕРІ РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РјР°СЃСЃРёРІ С†РµР»С‹С… С‡РёСЃРµР»).
   * @apiBody {Object[]} [agendaItems] РњР°СЃСЃРёРІ СЌР»РµРјРµРЅС‚РѕРІ РїРѕРІРµСЃС‚РєРё РґРЅСЏ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ).
   * @apiBody {Number} agendaItems.number РџРѕСЂСЏРґРєРѕРІС‹Р№ РЅРѕРјРµСЂ РІРѕРїСЂРѕСЃР° (С†РµР»РѕРµ С‡РёСЃР»Рѕ).
   * @apiBody {String} agendaItems.title РќР°Р·РІР°РЅРёРµ РІРѕРїСЂРѕСЃР° (СЃС‚СЂРѕРєР°).
   * @apiBody {Number} [agendaItems.speakerId] РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РґРѕРєР»Р°РґС‡РёРєР° (С†РµР»РѕРµ С‡РёСЃР»Рѕ РёР»Рё `null`).
   * @apiBody {String} [agendaItems.link] РЎСЃС‹Р»РєР° РЅР° РјР°С‚РµСЂРёР°Р»С‹ (СЃС‚СЂРѕРєР° РёР»Рё `null`).
   * @apiBody {String} [status] РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РѕРґРЅРѕ РёР·: `WAITING`, `IN_PROGRESS`, `COMPLETED`).
   * @apiSuccess {Object} meeting РћР±РЅРѕРІР»С‘РЅРЅС‹Р№ РѕР±СЉРµРєС‚ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Number} meeting.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р°.
   * @apiSuccess {String} meeting.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ.
   * @apiSuccess {String} meeting.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Boolean} meeting.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (`false`).
   * @apiSuccess {Object[]} meeting.divisions РњР°СЃСЃРёРІ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№.
   * @apiSuccess {Number} meeting.divisions.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ.
   * @apiSuccess {String} meeting.divisions.name РќР°Р·РІР°РЅРёРµ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏ.
   * @apiSuccess {Object[]} meeting.agendaItems РњР°СЃСЃРёРІ СЌР»РµРјРµРЅС‚РѕРІ РїРѕРІРµСЃС‚РєРё.
   * @apiSuccess {Number} meeting.agendaItems.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЌР»РµРјРµРЅС‚Р°.
   * @apiSuccess {Number} meeting.agendaItems.number РќРѕРјРµСЂ РІРѕРїСЂРѕСЃР°.
   * @apiSuccess {String} meeting.agendaItems.title РќР°Р·РІР°РЅРёРµ РІРѕРїСЂРѕСЃР°.
   * @apiSuccess {Number} [meeting.agendaItems.speakerId] РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РґРѕРєР»Р°РґС‡РёРєР°.
   * @apiSuccess {String} [meeting.agendaItems.link] РЎСЃС‹Р»РєР° РЅР° РјР°С‚РµСЂРёР°Р»С‹.
   * @apiError (400) BadRequest РћС€РёР±РєР°, РµСЃР»Рё РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ, РЅРµРІР°Р»РёРґРЅС‹Рµ РґР°РЅРЅС‹Рµ (РґР°С‚С‹, СЃС‚Р°С‚СѓСЃ, РјР°СЃСЃРёРІС‹) РёР»Рё СЃРІСЏР·Р°РЅРЅС‹Рµ Р·Р°РїРёСЃРё РЅРµ РјРѕРіСѓС‚ Р±С‹С‚СЊ СѓРґР°Р»РµРЅС‹.
   * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ.
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (400):
   *     {
   *         "error": "РџРѕР»СЏ name, startTime Рё endTime РѕР±СЏР·Р°С‚РµР»СЊРЅС‹"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl -X PUT -H "Content-Type: application/json" -d '{"name":"РћР±РЅРѕРІР»С‘РЅРЅРѕРµ Р·Р°СЃРµРґР°РЅРёРµ","startTime":"2025-06-03T10:00:00Z","endTime":"2025-06-03T12:00:00Z","divisionIds":[1],"agendaItems":[{"number":1,"title":"РќРѕРІС‹Р№ РІРѕРїСЂРѕСЃ","speakerId":26}],"status":"IN_PROGRESS"}' http://217.114.10.226:5000/api/meetings/119
   */
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, startTime, endTime, divisionIds, agendaItems, status } = req.body;
    console.log('Received update meeting data:', req.body);
    try {
      // Р’Р°Р»РёРґР°С†РёСЏ РІС…РѕРґРЅС‹С… РґР°РЅРЅС‹С…
      if (!name || !startTime || !endTime) {
        return res.status(400).json({ error: 'РџРѕР»СЏ name, startTime Рё endTime РѕР±СЏР·Р°С‚РµР»СЊРЅС‹' });
      }
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ С„РѕСЂРјР°С‚ РґР°С‚ startTime РёР»Рё endTime' });
      }
      if (divisionIds && !Array.isArray(divisionIds)) {
        return res.status(400).json({ error: 'divisionIds РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РјР°СЃСЃРёРІРѕРј' });
      }
      if (agendaItems && !Array.isArray(agendaItems)) {
        return res.status(400).json({ error: 'agendaItems РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РјР°СЃСЃРёРІРѕРј' });
      }
      if (status && !['WAITING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
        return res.status(400).json({ error: 'РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ. Р”РѕРїСѓСЃС‚РёРјС‹Рµ Р·РЅР°С‡РµРЅРёСЏ: WAITING, IN_PROGRESS, COMPLETED' });
      }

      // РџСЂРѕРІРµСЂРєР° СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёСЏ Р·Р°СЃРµРґР°РЅРёСЏ
      const meeting = await prisma.meeting.findUnique({ 
        where: { id: parseInt(id) },
        include: { agendaItems: true }
      });
      if (!meeting) {
        return res.status(404).json({ error: 'Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ' });
      }

      // РЈРґР°Р»РµРЅРёРµ СЃРІСЏР·Р°РЅРЅС‹С… РґР°РЅРЅС‹С… Рё РѕР±РЅРѕРІР»РµРЅРёРµ РІ С‚СЂР°РЅР·Р°РєС†РёРё
      const updatedMeeting = await prisma.$transaction(async (tx) => {
        // РЈРґР°Р»СЏРµРј VoteResult Рё Vote РґР»СЏ РєР°Р¶РґРѕРіРѕ agendaItem
        for (const agendaItem of meeting.agendaItems) {
          await tx.vote.deleteMany({
            where: { agendaItemId: agendaItem.id },
          });
          await tx.voteResult.deleteMany({
            where: { agendaItemId: agendaItem.id },
          });
        }
        // РЈРґР°Р»СЏРµРј agendaItems
        await tx.agendaItem.deleteMany({
          where: { meetingId: parseInt(id) },
        });
        // РћР±РЅРѕРІР»СЏРµРј Р·Р°СЃРµРґР°РЅРёРµ
        return await tx.meeting.update({
          where: { id: parseInt(id) },
          data: {
            name,
            startTime: startDate,
            endTime: endDate,
            status: status || meeting.status,
            isArchived: false,
            divisions: {
              set: [],
              connect: divisionIds ? divisionIds.map(id => ({ id: parseInt(id) })) : [],
            },
            agendaItems: {
              create: agendaItems ? agendaItems.map(item => ({
                number: item.number,
                title: item.title,
                speakerId: item.speakerId ? parseInt(item.speakerId) : null,
                link: item.link || null,
                voting: false,
                completed: false,
                activeIssue: false,
              })) : [],
            },
          },
          include: { divisions: true, agendaItems: true },
        });
      });

      res.json(updatedMeeting);
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё Р·Р°СЃРµРґР°РЅРёСЏ:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @api {delete} /api/meetings/:id РЈРґР°Р»РµРЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ
   * @apiName РЈРґР°Р»РµРЅРёРµР—Р°СЃРµРґР°РЅРёСЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription РЈРґР°Р»СЏРµС‚ Р·Р°СЃРµРґР°РЅРёРµ РїРѕ РµРіРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂСѓ, РІРєР»СЋС‡Р°СЏ РІСЃРµ СЃРІСЏР·Р°РЅРЅС‹Рµ СЌР»РµРјРµРЅС‚С‹ РїРѕРІРµСЃС‚РєРё, РіРѕР»РѕСЃР° Рё СЂРµР·СѓР»СЊС‚Р°С‚С‹ РіРѕР»РѕСЃРѕРІР°РЅРёСЏ. Р’С‹РїРѕР»РЅСЏРµС‚СЃСЏ РІ С‚СЂР°РЅР·Р°РєС†РёРё РґР»СЏ РѕР±РµСЃРїРµС‡РµРЅРёСЏ С†РµР»РѕСЃС‚РЅРѕСЃС‚Рё РґР°РЅРЅС‹С…. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ СѓРґР°Р»РµРЅРёСЏ РЅРµРЅСѓР¶РЅС‹С… РёР»Рё РѕС‚РјРµРЅС‘РЅРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№.
   * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
   * @apiSuccess {Boolean} success РЎС‚Р°С‚СѓСЃ РѕРїРµСЂР°С†РёРё. Р’РѕР·РІСЂР°С‰Р°РµС‚ `true` РїСЂРё СѓСЃРїРµС€РЅРѕРј СѓРґР°Р»РµРЅРёРё.
   * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ.
   * @apiError (400) BadRequest РћС€РёР±РєР°, РµСЃР»Рё СѓРґР°Р»РµРЅРёРµ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРѕ РёР·-Р·Р° РѕС€РёР±РѕРє Р±Р°Р·С‹ РґР°РЅРЅС‹С….
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
   *     {
   *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl -X DELETE http://217.114.10.226:5000/api/meetings/119
   */
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Deleting meeting ${id}`);
    try {
      const meeting = await prisma.meeting.findUnique({ 
        where: { id: parseInt(id) },
        include: { agendaItems: true }
      });
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      await prisma.$transaction(async (prisma) => {
        const agendaItems = meeting.agendaItems;
        for (const agendaItem of agendaItems) {
          await prisma.vote.deleteMany({
            where: { agendaItemId: agendaItem.id },
          });
          await prisma.voteResult.deleteMany({
            where: { agendaItemId: agendaItem.id },
          });
        }
        await prisma.agendaItem.deleteMany({
          where: { meetingId: parseInt(id) },
        });
        await prisma.voteResult.deleteMany({
          where: { meetingId: parseInt(id) },
        });
        await prisma.meeting.delete({
          where: { id: parseInt(id) },
        });
      });

      res.json({ success: true });
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё СѓРґР°Р»РµРЅРёРё Р·Р°СЃРµРґР°РЅРёСЏ:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @api {post} /api/meetings/:id/archive РђСЂС…РёРІРёСЂРѕРІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ
   * @apiName РђСЂС…РёРІРёСЂРѕРІР°РЅРёРµР—Р°СЃРµРґР°РЅРёСЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription РЈСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ С„Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (`isArchived: true`) РґР»СЏ Р·Р°СЃРµРґР°РЅРёСЏ РїРѕ РµРіРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂСѓ. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РїРµСЂРµРјРµС‰РµРЅРёСЏ Р·Р°РІРµСЂС€С‘РЅРЅС‹С… РёР»Рё РЅРµР°РєС‚СѓР°Р»СЊРЅС‹С… Р·Р°СЃРµРґР°РЅРёР№ РІ Р°СЂС…РёРІ.
   * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
   * @apiSuccess {Object} meeting РћР±РЅРѕРІР»С‘РЅРЅС‹Р№ РѕР±СЉРµРєС‚ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Number} meeting.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р°.
   * @apiSuccess {String} meeting.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ.
   * @apiSuccess {String} meeting.status РЎС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Boolean} meeting.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё (`true`).
   * @apiError (400) BadRequest РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ РёР»Рё РѕР±РЅРѕРІР»РµРЅРёРµ РЅРµРІРѕР·РјРѕР¶РЅРѕ.
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ:
   *     {
   *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl -X POST http://217.114.10.226:5000/api/meetings/119/archive
   */
  router.post('/:id/archive', async (req, res) => {
    const { id } = req.params;
    try {
      const meeting = await prisma.meeting.update({
        where: { id: parseInt(id) },
        data: { isArchived: true },
      });
      res.json(meeting);
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё Р°СЂС…РёРІРёСЂРѕРІР°РЅРёРё Р·Р°СЃРµРґР°РЅРёСЏ:', error);
      res.status(400).json({ error: error.message });
    }
  });


/**
 * @api {get} /api/meetings/:id/participants РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° СѓС‡Р°СЃС‚РЅРёРєРѕРІ Р·Р°СЃРµРґР°РЅРёСЏ
 * @apiName РџРѕР»СѓС‡РµРЅРёРµРЈС‡Р°СЃС‚РЅРёРєРѕРІР—Р°СЃРµРґР°РЅРёСЏ
 * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
 * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ СЃРїРёСЃРѕРє РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, СѓС‡Р°СЃС‚РІСѓСЋС‰РёС… РІ Р·Р°СЃРµРґР°РЅРёРё, РЅР° РѕСЃРЅРѕРІРµ СЃРІСЏР·Р°РЅРЅС‹С… РїРѕРґСЂР°Р·РґРµР»РµРЅРёР№. Р’РєР»СЋС‡Р°РµС‚ С‚РѕР»СЊРєРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ, РёРјСЏ Рё СЃС‚Р°С‚СѓСЃ РѕРЅР»Р°Р№РЅ/РѕС„С„Р»Р°Р№РЅ.
 * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
 * @apiSuccess {Object[]} participants РњР°СЃСЃРёРІ РѕР±СЉРµРєС‚РѕРІ СѓС‡Р°СЃС‚РЅРёРєРѕРІ.
 * @apiSuccess {Number} participants.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
 * @apiSuccess {String} participants.name РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
 * @apiSuccess {Boolean} participants.isOnline РЎС‚Р°С‚СѓСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (true, РµСЃР»Рё РѕРЅР»Р°Р№РЅ).
 * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ.
 * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
 * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
 *     {
 *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
 *     }
 * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
 *     curl http://217.114.10.226:5000/api/meetings/118/participants
 */
router.get('/:id/participants', async (req, res) => {
  const { id } = req.params;
  try {
    const meetingId = parseInt(id);
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        divisions: {
          include: {
            users: true
          }
        }
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ' });
    }

    // Получаем всех пользователей из подразделений заседания, исключая "Приглашенные"
    const allDivisions = meeting.divisions || [];
    const regularDivisions = allDivisions.filter(d => {
      if (!d || !d.name) return true;
      const name = d.name.replace(/👥/g, '').trim().toLowerCase();
      return name !== 'приглашенные';
    });

    const userIds = new Set();
    regularDivisions.forEach(division => {
      division.users.forEach(user => userIds.add(user.id));
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: {
        id: true,
        name: true,
        division: true,
        isOnline: true,
        isBadgeInserted: true,
        televicExternalId: true
      }
    });

    // Получаем информацию о местоположении участников
    const participantLocations = await prisma.$queryRaw`
      SELECT * FROM "ParticipantLocation" WHERE "meetingId" = ${meetingId}
    `;

    // Получаем информацию о доверенностях
    const proxies = await prisma.$queryRaw`
      SELECT * FROM "Proxy" WHERE "meetingId" = ${meetingId}
    `;

    // Формируем данные участников с location, proxy и receivedProxies
    const participants = users.map(user => {
      const locationRecord = participantLocations.find(loc => loc.userId === user.id);
      const proxyRecord = proxies.find(p => p.fromUserId === user.id);
      const receivedProxies = proxies
        .filter(p => p.toUserId === user.id)
        .map(p => {
          const fromUser = users.find(u => u.id === p.fromUserId);
          return {
            fromUserId: p.fromUserId,
            fromUserName: fromUser?.name || 'Unknown'
          };
        });

      return {
        id: user.id,
        name: user.name,
        divisions: [{ id: user.division?.id, name: user.division?.name }].filter(d => d.id),
        location: locationRecord?.location || 'SITE',
        proxy: proxyRecord ? {
          toUserId: proxyRecord.toUserId,
          toUserName: users.find(u => u.id === proxyRecord.toUserId)?.name || 'Unknown'
        } : null,
        receivedProxies,
        voteWeight: 1 + receivedProxies.length,
        isOnline: user.isOnline || false,
        isBadgeInserted: user.isBadgeInserted || false,
        televicExternalId: user.televicExternalId || null
      };
    });

    res.json({ participants });
  } catch (error) {
    console.error('РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СѓС‡Р°СЃС‚РЅРёРєРѕРІ Р·Р°СЃРµРґР°РЅРёСЏ:', error);
    res.status(500).json({ error: 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєРѕРІ' });
  }
});

/**
 * @api {post} /api/meetings/:id/participants/save Сохранение настроек участников заседания
 * @apiName СохранениеУчастниковЗаседания
 * @apiGroup Заседания
 * @apiDescription Сохраняет информацию о местоположении участников (SITE/HALL) и доверенностях
 */
router.post('/:id/participants/save', async (req, res) => {
  const { id } = req.params;
  const { participants } = req.body;

  try {
    const meetingId = parseInt(id);

    // Проверяем, что заседание существует
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Заседание не найдено' });
    }

    // Обрабатываем каждого участника
    for (const participant of participants) {
      const { userId, location, proxyToUserId } = participant;

      // Сохраняем или обновляем местоположение
      await prisma.$executeRaw`
        INSERT INTO "ParticipantLocation" ("meetingId", "userId", "location", "createdAt", "updatedAt")
        VALUES (${meetingId}, ${userId}, ${location}, NOW(), NOW())
        ON CONFLICT ("meetingId", "userId")
        DO UPDATE SET "location" = ${location}, "updatedAt" = NOW()
      `;

      // Удаляем старую доверенность, если есть
      await prisma.$executeRaw`
        DELETE FROM "Proxy" WHERE "meetingId" = ${meetingId} AND "fromUserId" = ${userId}
      `;

      // Добавляем новую доверенность, если указана
      if (proxyToUserId) {
        await prisma.$executeRaw`
          INSERT INTO "Proxy" ("meetingId", "fromUserId", "toUserId", "createdAt", "updatedAt")
          VALUES (${meetingId}, ${userId}, ${proxyToUserId}, NOW(), NOW())
        `;
      }
    }

    res.json({ success: true, message: 'Данные участников сохранены' });
  } catch (error) {
    console.error('Ошибка при сохранении участников:', error);
    res.status(500).json({ error: 'Не удалось сохранить данные участников' });
  }
});









/**
 * @api {get} /api/meetings/:id/total-users РџРѕР»СѓС‡РµРЅРёРµ РѕР±С‰РµРіРѕ РєРѕР»РёС‡РµСЃС‚РІР° РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РїРѕ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏРј Р·Р°СЃРµРґР°РЅРёСЏ
 * @apiName РџРѕР»СѓС‡РµРЅРёРµРћР±С‰РµРіРѕРљРѕР»РёС‡РµСЃС‚РІР°РџРѕР»СЊР·РѕРІР°С‚РµР»РµР№
 * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
 * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ РѕР±С‰РµРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, СЃРІСЏР·Р°РЅРЅС‹С… СЃ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏРјРё (divisions) СѓРєР°Р·Р°РЅРЅРѕРіРѕ Р·Р°СЃРµРґР°РЅРёСЏ. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РёС‚РѕРіРѕРІРѕРіРѕ С‡РёСЃР»Р° СѓС‡Р°СЃС‚РЅРёРєРѕРІ РЅР° СЃС‚СЂР°РЅРёС†Рµ Р·Р°СЃРµРґР°РЅРёСЏ.
 * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
 * @apiSuccess {Object} response РћР±СЉРµРєС‚ СЃ РѕР±С‰РёРј РєРѕР»РёС‡РµСЃС‚РІРѕРј РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
 * @apiSuccess {Number} response.totalUsers РћР±С‰РµРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
 * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ.
 * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
 * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
 *     {
 *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
 *     }
 * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
 *     curl http://217.114.10.226:5000/api/meetings/118/total-users
 */
router.get('/:id/total-users', async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(id) },
      include: { divisions: true, agendaItems: true },
    });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    const divisionIds = meeting.divisions.map(d => d.id);
    const userCounts = await Promise.all(
      divisionIds.map(async (divisionId) => {
        const count = await prisma.user.count({
          where: { divisionId },
        });
        return count;
      })
    );
    const totalUsers = userCounts.reduce((sum, count) => sum + count, 0);
    res.json({ totalUsers });
  } catch (error) {
    console.error('РћС€РёР±РєР° РїСЂРё РїРѕРґСЃС‡С‘С‚Рµ РѕР±С‰РµРіРѕ РєРѕР»РёС‡РµСЃС‚РІР° РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№:', error);
    res.status(500).json({ error: error.message });
  }
});






/**
 * @api {get} /api/meetings/:id/online-users РџРѕР»СѓС‡РµРЅРёРµ РєРѕР»РёС‡РµСЃС‚РІР° РѕРЅР»Р°Р№РЅ-РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РїРѕ Р·Р°СЃРµРґР°РЅРёСЋ
 * @apiName РџРѕР»СѓС‡РµРЅРёРµРћРЅР»Р°Р№РЅРџРѕР»СЊР·РѕРІР°С‚РµР»РµР№
 * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
 * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ РєРѕР»РёС‡РµСЃС‚РІРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ СЃ СЃС‚Р°С‚СѓСЃРѕРј `isOnline: true`, СЃРІСЏР·Р°РЅРЅС‹С… СЃ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏРјРё (divisions) СѓРєР°Р·Р°РЅРЅРѕРіРѕ Р·Р°СЃРµРґР°РЅРёСЏ. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ С‚РµРєСѓС‰РµРіРѕ С‡РёСЃР»Р° РїСЂРёСЃСѓС‚СЃС‚РІСѓСЋС‰РёС… СѓС‡Р°СЃС‚РЅРёРєРѕРІ.
 * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
 * @apiSuccess {Object} response РћР±СЉРµРєС‚ СЃ РєРѕР»РёС‡РµСЃС‚РІРѕРј РѕРЅР»Р°Р№РЅ-РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
 * @apiSuccess {Number} response.onlineUsers РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РѕРЅР»Р°Р№РЅ.
 * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ.
 * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
 * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
 *     {
 *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
 *     }
 * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
 *     curl http://217.114.10.226:5000/api/meetings/118/online-users
 */
router.get('/:id/online-users', async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(id) },
      include: { divisions: true, agendaItems: true },
    });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    const divisionIds = meeting.divisions.map(d => d.id);
    const onlineUsers = await prisma.user.count({
      where: {
        divisionId: { in: divisionIds },
        isOnline: true,
      },
    });
    res.json({ onlineUsers });
  } catch (error) {
    console.error('РћС€РёР±РєР° РїСЂРё РїРѕРґСЃС‡С‘С‚Рµ РѕРЅР»Р°Р№РЅ-РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№:', error);
    res.status(500).json({ error: error.message });
  }
});







/**
 * @api {get} /api/meetings/:id/absent-users РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РїРѕ Р·Р°СЃРµРґР°РЅРёСЋ
 * @apiName РџРѕР»СѓС‡РµРЅРёРµРћС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёС…РџРѕР»СЊР·РѕРІР°С‚РµР»РµР№
 * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
 * @apiDescription Р’РѕР·РІСЂР°С‰Р°РµС‚ РјР°СЃСЃРёРІ РёРјС‘РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№, СЃРІСЏР·Р°РЅРЅС‹С… СЃ РїРѕРґСЂР°Р·РґРµР»РµРЅРёСЏРјРё (divisions) СѓРєР°Р·Р°РЅРЅРѕРіРѕ Р·Р°СЃРµРґР°РЅРёСЏ, Сѓ РєРѕС‚РѕСЂС‹С… СЃС‚Р°С‚СѓСЃ `isOnline: false`. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ СЃРїРёСЃРєР° РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёС… СѓС‡Р°СЃС‚РЅРёРєРѕРІ.
 * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
 * @apiSuccess {Object} response РћР±СЉРµРєС‚ СЃ РјР°СЃСЃРёРІРѕРј РёРјС‘РЅ РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.
 * @apiSuccess {String[]} absentUsers РњР°СЃСЃРёРІ РёРјС‘РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ СЃ `isOnline: false`.
 * @apiError (404) NotFound РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ.
 * @apiError (500) ServerError РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РёР»Рё Р±Р°Р·С‹ РґР°РЅРЅС‹С….
 * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ (404):
 *     {
 *         "error": "Р—Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ"
 *     }
 * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
 *     curl http://217.114.10.226:5000/api/meetings/118/absent-users
 */
router.get('/:id/absent-users', async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(id) },
      include: { divisions: true, agendaItems: true },
    });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    const divisionIds = meeting.divisions.map(d => d.id);
    const absentUsers = await prisma.user.findMany({
      where: {
        divisionId: { in: divisionIds },
        isOnline: false,
      },
      select: { name: true },
    });
    res.json({ absentUsers: absentUsers.map(user => user.name) });
  } catch (error) {
    console.error('РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёС… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№:', error);
    res.status(500).json({ error: error.message });
  }
});















  /**
   * @api {post} /api/meetings/:id/status РћР±РЅРѕРІР»РµРЅРёРµ СЃС‚Р°С‚СѓСЃР° Р·Р°СЃРµРґР°РЅРёСЏ
   * @apiName РћР±РЅРѕРІР»РµРЅРёРµРЎС‚Р°С‚СѓСЃР°Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiGroup Р—Р°СЃРµРґР°РЅРёСЏ
   * @apiDescription РћР±РЅРѕРІР»СЏРµС‚ СЃС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ РїРѕ РµРіРѕ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂСѓ. Р•СЃР»Рё СЃС‚Р°С‚СѓСЃ РјРµРЅСЏРµС‚СЃСЏ РЅР° `COMPLETED`, РІСЃРµ СЌР»РµРјРµРЅС‚С‹ РїРѕРІРµСЃС‚РєРё РґРЅСЏ РїРѕРјРµС‡Р°СЋС‚СЃСЏ РєР°Рє Р·Р°РІРµСЂС€С‘РЅРЅС‹Рµ (`completed: true`). РћС‚РїСЂР°РІР»СЏРµС‚ СѓРІРµРґРѕРјР»РµРЅРёРµ С‡РµСЂРµР· РєР°РЅР°Р» PostgreSQL `meeting_status_channel`. РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ Р¶РёР·РЅРµРЅРЅС‹Рј С†РёРєР»РѕРј Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiParam {Number} id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ (РїР°СЂР°РјРµС‚СЂ РїСѓС‚Рё, С†РµР»РѕРµ С‡РёСЃР»Рѕ).
   * @apiBody {String} status РќРѕРІС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїРѕР»Рµ, РѕРґРЅРѕ РёР·: `WAITING`, `IN_PROGRESS`, `COMPLETED`).
   * @apiSuccess {Object} meeting РћР±РЅРѕРІР»С‘РЅРЅС‹Р№ РѕР±СЉРµРєС‚ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Number} meeting.id РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.name РќР°Р·РІР°РЅРёРµ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {String} meeting.startTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РЅР°С‡Р°Р»Р°.
   * @apiSuccess {String} meeting.endTime Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕРєРѕРЅС‡Р°РЅРёСЏ.
   * @apiSuccess {String} meeting.status РќРѕРІС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ.
   * @apiSuccess {Boolean} meeting.isArchived Р¤Р»Р°Рі Р°СЂС…РёРІР°С†РёРё.
   * @apiError (400) BadRequest РћС€РёР±РєР°, РµСЃР»Рё Р·Р°СЃРµРґР°РЅРёРµ РЅРµ РЅР°Р№РґРµРЅРѕ, СЃС‚Р°С‚СѓСЃ РЅРµРєРѕСЂСЂРµРєС‚РµРЅ РёР»Рё РѕР±РЅРѕРІР»РµРЅРёРµ РЅРµРІРѕР·РјРѕР¶РЅРѕ.
   * @apiErrorExample {json} РџСЂРёРјРµСЂ РѕС‚РІРµС‚Р° РїСЂРё РѕС€РёР±РєРµ:
   *     {
   *         "error": "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°СЃРµРґР°РЅРёСЏ"
   *     }
   * @apiExample {curl} РџСЂРёРјРµСЂ Р·Р°РїСЂРѕСЃР°:
   *     curl -X POST -H "Content-Type: application/json" -d '{"status":"IN_PROGRESS"}' http://217.114.10.226:5000/api/meetings/119/status
   */
  router.post('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      // First, fetch meeting to check if we need to create in Televic
      const existingMeeting = await prisma.meeting.findUnique({
        where: { id: parseInt(id) },
        include: {
          divisions: true
        }
      });

      if (!existingMeeting) {
        return res.status(404).json({ error: 'Заседание не найдено' });
      }

      // If status is changing to IN_PROGRESS and createInTelevic is true, create in Televic first
      if (status === 'IN_PROGRESS' && existingMeeting.createInTelevic && !existingMeeting.televicMeetingId && io) {
        console.log('[Televic] Starting meeting, need to create in Televic first...');

        // Don't await - do it in background, but send response after
        (async () => {
          try {
            // Get linked delegates from meeting divisions
            const divisionIds = existingMeeting.divisions.map(d => d.id);
            const linkedUsers = await prisma.user.findMany({
              where: {
                divisionId: { in: divisionIds },
                televicExternalId: { not: null }
              },
              select: { televicExternalId: true }
            });
            const delegateIds = linkedUsers.map(u => u.televicExternalId).filter(Boolean);

            console.log('[Televic] Creating mirror meeting for:', existingMeeting.id, 'delegates:', delegateIds);

            // Find connector socket
            const coconNS = io.of('/cocon-connector');
            let socket = null;
            for (const [sid, sock] of coconNS.sockets) {
              socket = sock;
              break;
            }

            if (!socket) {
              console.log('[Televic] No connector online, skipping meeting creation');
              return;
            }

            // Helper to send command
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

            // Step 1: End all active meetings (Running, Paused, New)
            console.log('[Televic] Getting all meetings to check for active ones...');
            const getAllResult = await sendCommand('/Meeting_Agenda/GetAllMeetings');

            if (getAllResult.ok && getAllResult.data) {
              const allMeetingsData = getAllResult.data.data;
              const parsed = typeof allMeetingsData === 'string' ? JSON.parse(allMeetingsData) : allMeetingsData;
              const activeMeetings = parsed?.GetAllMeetings?.Meetings?.filter(m =>
                m.State === 'Running' || m.State === 'Paused' || m.State === 'New'
              ) || [];

              console.log('[Televic] Active meetings to end:', activeMeetings.map(m => `ID ${m.Id} "${m.Title}" (${m.State})`));

              // End each active meeting using SetMeetingState API
              for (const activeMeeting of activeMeetings) {
                console.log(`[Televic] Ending meeting ID ${activeMeeting.Id}...`);
                const endResult = await sendCommand('/Meeting_Agenda/SetMeetingState', {
                  State: 'Ended',
                  MeetingId: activeMeeting.Id
                });

                console.log(`[Televic] SetMeetingState result for ID ${activeMeeting.Id}:`, JSON.stringify(endResult));

                if (endResult.ok) {
                  console.log(`[Televic] Successfully ended meeting ID ${activeMeeting.Id}`);
                } else {
                  console.error(`[Televic] Failed to end meeting ID ${activeMeeting.Id}:`, endResult.error);
                }
              }
            }

            // Step 2: Create new meeting in Televic
            // Format dates: 2017/6/5 00:00:00
            const formatDate = (d) => {
              if (!d) return null;
              const dt = new Date(d);
              const pad = (n) => String(n).padStart(2, '0');
              return `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
            };

            // Ensure From time is at least 60 seconds in the future from NOW
            let fromDateTime = existingMeeting.startTime ? new Date(existingMeeting.startTime) : new Date();
            const now = new Date();
            const minFutureTime = new Date(now.getTime() + 60000); // +1 minute minimum

            if (fromDateTime <= minFutureTime) {
              console.log('[Televic] Warning: Start time is too close or in the past, adjusting to now + 1 minute');
              console.log('[Televic] Original time:', fromDateTime.toISOString());
              console.log('[Televic] Current time:', now.toISOString());
              fromDateTime = minFutureTime;
            }

            // Ensure To time is after From time
            let toDateTime = existingMeeting.endTime ? new Date(existingMeeting.endTime) : new Date(fromDateTime.getTime() + 3600000);
            if (toDateTime <= fromDateTime) {
              console.log('[Televic] Warning: End time is before start time, adjusting to start + 1 hour');
              toDateTime = new Date(fromDateTime.getTime() + 3600000); // +1 hour
            }

            const fromTime = formatDate(fromDateTime);
            const toTime = formatDate(toDateTime);

            console.log('[Televic] Meeting times - From:', fromTime, 'To:', toTime);

            const createResult = await sendCommand('/Meeting_Agenda/StartEmptyMeeting', {
              Title: existingMeeting.name,
              From: fromTime,
              To: toTime,
              LoginMethod: 2, // Free seating, must authenticate
              AuthenticationMode: 0, // Internal
              AuthenticationType: 1  // Badge only
            });

            console.log('[Televic] Raw result:', JSON.stringify(createResult));

            if (!createResult.ok || !createResult.data) {
              console.error('[Televic] Failed to create meeting:', createResult.error || 'Unknown error');
              return;
            }

            const meetingData = createResult.data.data;
            console.log('[Televic] Meeting data type:', typeof meetingData);
            console.log('[Televic] Meeting data:', meetingData);
            const parsed = typeof meetingData === 'string' ? JSON.parse(meetingData) : meetingData;
            console.log('[Televic] Parsed data:', JSON.stringify(parsed));
            const televicMeetingId = parsed?.StartEmptyMeeting?.MeetingId || null;

            if (!televicMeetingId) {
              console.error('[Televic] No MeetingId returned');
              return;
            }

            console.log('[Televic] Created meeting ID:', televicMeetingId);

            // Add delegates
            if (delegateIds.length > 0) {
              console.log(`[Televic] Adding ${delegateIds.length} delegates to meeting...`);
              for (const delegateId of delegateIds) {
                try {
                  console.log(`[Televic] Adding delegate ${delegateId}...`);
                  await sendCommand('/Meeting_Agenda/AddDelegatesToMeeting', {
                    MeetingId: televicMeetingId,
                    DelegateIds: String(delegateId)
                  });
                  console.log(`[Televic] Successfully added delegate ${delegateId}`);
                } catch (e) {
                  console.error(`[Televic] Failed to add delegate ${delegateId}:`, e.message);
                }
              }
              console.log('[Televic] Finished adding delegates');
            }

            // Add agenda items to CoCon
            try {
              console.log('[Televic] Fetching agenda items from database...');
              const agendaItems = await prisma.agendaItem.findMany({
                where: { meetingId: parseInt(id) },
                orderBy: { number: 'asc' },
                include: {
                  speaker: {
                    select: { name: true }
                  }
                }
              });

              if (agendaItems.length > 0) {
                console.log(`[Televic] Found ${agendaItems.length} agenda items, adding to CoCon...`);

                for (const item of agendaItems) {
                  try {
                    const agendaParams = {
                      Title: item.title || `Вопрос ${item.number}`,
                      Des: item.speaker?.name || '',  // Description = speaker name
                      Sequence: String(item.number),  // Sequence number (1, 2, 3, etc.)
                      Type: 'Discussion'  // Default type
                    };

                    console.log(`[Televic] Adding agenda item ${item.number}: "${agendaParams.Title}"...`);
                    const addResult = await sendCommand('/Meeting_Agenda/AddAgendaItem', agendaParams);

                    if (addResult.ok) {
                      console.log(`[Televic] Successfully added agenda item ${item.number}`);
                    } else {
                      console.error(`[Televic] Failed to add agenda item ${item.number}:`, addResult.error);
                    }
                  } catch (e) {
                    console.error(`[Televic] Error adding agenda item ${item.number}:`, e.message);
                  }
                }
                console.log('[Televic] Finished adding agenda items');
              } else {
                console.log('[Televic] No agenda items found in database');
              }
            } catch (e) {
              console.error('[Televic] Failed to fetch/add agenda items:', e.message);
            }

            // Force meeting state to Running (in case it was created in New state)
            console.log('[Televic] Setting meeting state to Running...');
            try {
              const setStateResult = await sendCommand('/Meeting_Agenda/SetMeetingState', {
                State: 'Running',
                MeetingId: televicMeetingId
              });
              console.log('[Televic] SetMeetingState to Running result:', JSON.stringify(setStateResult));
              if (setStateResult.ok) {
                console.log('[Televic] Successfully set meeting to Running state');
              } else {
                console.error('[Televic] Failed to set meeting to Running:', setStateResult.error);
              }
            } catch (e) {
              console.error('[Televic] Error setting meeting to Running:', e.message);
            }

            // Update database with televicMeetingId
            await prisma.meeting.update({
              where: { id: parseInt(id) },
              data: { televicMeetingId: Number(televicMeetingId) }
            });

            console.log('[Televic] Mirror meeting created successfully');

            // Notify all clients about the update
            io.emit('meeting:updated', {
              meetingId: parseInt(id),
              televicMeetingId: Number(televicMeetingId)
            });
          } catch (televicError) {
            console.error('[Televic] Failed to create mirror meeting:', televicError.message);
          }
        })();
      }

      // Update meeting status
      const meeting = await prisma.meeting.update({
        where: { id: parseInt(id) },
        data: {
          status,
          agendaItems: status === 'COMPLETED' ? {
            updateMany: {
              where: { meetingId: parseInt(id) },
              data: { completed: true },
            },
          } : undefined,
        },
      });
      await pgClient.query(`NOTIFY meeting_status_channel, '${JSON.stringify({ id: parseInt(id), status })}'`);
      res.json(meeting);
    } catch (error) {
      console.error('РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё СЃС‚Р°С‚СѓСЃР° Р·Р°СЃРµРґР°РЅРёСЏ:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @api {put} /api/meetings/:id/screen-config Сохранение конфигурации экранов
   * @apiName СохранениеКонфигурацииЭкранов
   * @apiGroup Заседания
   * @apiDescription Сохраняет конфигурацию экранов для заседания (registration, agenda, voting, final).
   * @apiParam {Number} id Идентификатор заседания.
   * @apiParam {Object} screenConfig JSON объект с конфигурациями экранов.
   * @apiSuccess {Object} meeting Обновленное заседание.
   */
  router.put('/:id/screen-config', async (req, res) => {
    const { id } = req.params;
    const { screenConfig } = req.body;
    try {
      const meeting = await prisma.meeting.update({
        where: { id: parseInt(id) },
        data: { screenConfig },
      });
      res.json(meeting);
    } catch (error) {
      console.error('Ошибка при сохранении конфигурации экранов:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {get} /api/meetings/:id/screen-config Получение конфигурации экранов
   * @apiName ПолучениеКонфигурацииЭкранов
   * @apiGroup Заседания
   * @apiDescription Возвращает конфигурацию экранов для заседания.
   * @apiParam {Number} id Идентификатор заседания.
   * @apiSuccess {Object} screenConfig JSON объект с конфигурациями экранов.
   */
  router.get('/:id/screen-config', async (req, res) => {
    const { id } = req.params;
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: parseInt(id) },
        select: { screenConfig: true },
      });
      if (!meeting) {
        return res.status(404).json({ error: 'Заседание не найдено' });
      }
      res.json(meeting.screenConfig || {});
    } catch (error) {
      console.error('Ошибка при получении конфигурации экранов:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /api/meetings/:id/show-vote - Toggle showVoteOnBroadcast flag
  router.put('/:id/show-vote', async (req, res) => {
    const { id } = req.params;
    const { show } = req.body;

    try {
      const meeting = await prisma.meeting.update({
        where: { id: parseInt(id) },
        data: { showVoteOnBroadcast: Boolean(show) }
      });

      // Notify all clients about the update
      if (io) {
        io.emit('meeting-show-vote-updated', {
          meetingId: parseInt(id),
          showVoteOnBroadcast: meeting.showVoteOnBroadcast
        });
      }

      res.json({ ok: true, showVoteOnBroadcast: meeting.showVoteOnBroadcast });
    } catch (error) {
      console.error('Error updating showVoteOnBroadcast:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mount queue router as nested router (supports /api/meetings/:id/queue routes)
  router.use('/:id/queue', require('./queue.cjs')(prisma, io));

  return router;
};
