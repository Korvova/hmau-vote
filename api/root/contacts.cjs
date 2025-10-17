const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/contacts - Получить контакт (всегда возвращает первую запись или пустой объект)
router.get('/', async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst();
    res.json(contact || { name: '', phone: '' });
  } catch (error) {
    console.error('Ошибка при получении контакта:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contacts - Создать или обновить контакт
router.post('/', async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'ФИО и телефон обязательны' });
    }

    // Проверяем, есть ли уже контакт
    const existingContact = await prisma.contact.findFirst();

    let contact;
    if (existingContact) {
      // Обновляем существующий
      contact = await prisma.contact.update({
        where: { id: existingContact.id },
        data: { name, phone, updatedAt: new Date() },
      });
    } else {
      // Создаём новый
      contact = await prisma.contact.create({
        data: { name, phone },
      });
    }

    res.json(contact);
  } catch (error) {
    console.error('Ошибка при сохранении контакта:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
