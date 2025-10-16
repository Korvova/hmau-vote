const express = require('express');

const router = express.Router();

/**
 * @api {get} /api/screen-configs Получить все конфигурации экранов
 * @apiName GetScreenConfigs
 * @apiGroup ScreenConfig
 */
router.get('/', async (req, res) => {
  const { prisma } = req;
  try {
    const configs = await prisma.screenConfig.findMany({
      orderBy: { type: 'asc' },
    });
    res.json(configs);
  } catch (error) {
    console.error('Ошибка при получении конфигураций экранов:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {get} /api/screen-configs/:type Получить конфигурацию экрана по типу
 * @apiName GetScreenConfigByType
 * @apiGroup ScreenConfig
 */
router.get('/:type', async (req, res) => {
  const { prisma } = req;
  const { type } = req.params;

  try {
    const config = await prisma.screenConfig.findUnique({
      where: { type: type.toUpperCase() },
    });

    if (!config) {
      return res.status(404).json({ error: 'Конфигурация не найдена' });
    }

    res.json(config);
  } catch (error) {
    console.error('Ошибка при получении конфигурации экрана:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {put} /api/screen-configs/:type Обновить конфигурацию экрана
 * @apiName UpdateScreenConfig
 * @apiGroup ScreenConfig
 */
router.put('/:type', async (req, res) => {
  const { prisma } = req;
  const { type } = req.params;
  const { config } = req.body;

  try {
    const updated = await prisma.screenConfig.update({
      where: { type: type.toUpperCase() },
      data: {
        config,
        updatedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Ошибка при обновлении конфигурации экрана:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {post} /api/screen-configs/reset/:type Сбросить конфигурацию к умолчанию
 * @apiName ResetScreenConfig
 * @apiGroup ScreenConfig
 */
router.post('/reset/:type', async (req, res) => {
  const { prisma } = req;
  const { type } = req.params;

  const defaultConfigs = {
    REGISTRATION: {
      backgroundColor: '#ffffff',
      headerColor: '#1976d2',
      titleFontSize: '48px',
      showLogo: true,
      showParticipants: true,
    },
    AGENDA: {
      backgroundColor: '#ffffff',
      headerColor: '#1976d2',
      titleFontSize: '36px',
      showLogo: true,
      showAgenda: true,
    },
    VOTING: {
      backgroundColor: '#ffffff',
      headerColor: '#1976d2',
      titleFontSize: '42px',
      showTimer: true,
      showResults: true,
    },
    FINAL: {
      backgroundColor: '#ffffff',
      headerColor: '#4caf50',
      titleFontSize: '48px',
      showDecision: true,
      showResults: true,
    },
  };

  try {
    const typeUpper = type.toUpperCase();
    const defaultConfig = defaultConfigs[typeUpper];

    if (!defaultConfig) {
      return res.status(400).json({ error: 'Неизвестный тип экрана' });
    }

    const updated = await prisma.screenConfig.update({
      where: { type: typeUpper },
      data: {
        config: defaultConfig,
        updatedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Ошибка при сбросе конфигурации экрана:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
