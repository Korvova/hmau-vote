const express = require('express');
const router = express.Router();

module.exports = (prisma) => {
  /**
   * @api {get} /api/duration-templates Получить список шаблонов длительности
   * @apiName GetDurationTemplates
   * @apiGroup Templates
   * @apiDescription Возвращает шаблоны длительности для голосования из базы данных
   */
  router.get('/', async (req, res) => {
    try {
      const templates = await prisma.durationTemplate.findMany({
        orderBy: { id: 'asc' }
      });
      res.json(templates);
    } catch (error) {
      console.error('Error getting duration templates:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {post} /api/duration-templates Создать новый шаблон длительности
   * @apiName CreateDurationTemplate
   * @apiGroup Templates
   */
  router.post('/', async (req, res) => {
    try {
      const { name, durationInSeconds } = req.body;

      if (!name || durationInSeconds === undefined) {
        return res.status(400).json({ error: 'Name and durationInSeconds are required' });
      }

      const template = await prisma.durationTemplate.create({
        data: {
          name,
          durationInSeconds: parseInt(durationInSeconds)
        }
      });

      res.json(template);
    } catch (error) {
      console.error('Error creating duration template:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {put} /api/duration-templates/:id Обновить шаблон длительности
   * @apiName UpdateDurationTemplate
   * @apiGroup Templates
   */
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, durationInSeconds } = req.body;

      const template = await prisma.durationTemplate.update({
        where: { id: parseInt(id) },
        data: {
          name,
          durationInSeconds: parseInt(durationInSeconds)
        }
      });

      res.json(template);
    } catch (error) {
      console.error('Error updating duration template:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @api {delete} /api/duration-templates/:id Удалить шаблон длительности
   * @apiName DeleteDurationTemplate
   * @apiGroup Templates
   */
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.durationTemplate.delete({
        where: { id: parseInt(id) }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting duration template:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
