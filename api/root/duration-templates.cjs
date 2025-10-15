const express = require('express');
const router = express.Router();

/**
 * @api {get} /api/duration-templates Получить список шаблонов длительности
 * @apiName GetDurationTemplates
 * @apiGroup Templates
 * @apiDescription Возвращает предустановленные шаблоны длительности для голосования
 */
router.get('/', async (req, res) => {
  try {
    // Hardcoded duration templates (in seconds)
    const templates = [
      { id: 1, name: '30 секунд', duration: 30 },
      { id: 2, name: '1 минута', duration: 60 },
      { id: 3, name: '2 минуты', duration: 120 },
      { id: 4, name: '3 минуты', duration: 180 },
      { id: 5, name: '5 минут', duration: 300 },
      { id: 6, name: '10 минут', duration: 600 },
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error getting duration templates:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
