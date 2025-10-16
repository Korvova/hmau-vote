const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/screens');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Только изображения разрешены (jpeg, jpg, png, gif, webp)'));
  },
});

/**
 * @api {post} /api/screen-uploads/logo Загрузить логотип
 * @apiName UploadLogo
 * @apiGroup ScreenUploads
 */
router.post('/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const fileUrl = `/uploads/screens/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('Ошибка при загрузке логотипа:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {post} /api/screen-uploads/background Загрузить фон
 * @apiName UploadBackground
 * @apiGroup ScreenUploads
 */
router.post('/background', upload.single('background'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const fileUrl = `/uploads/screens/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('Ошибка при загрузке фона:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @api {delete} /api/screen-uploads/:filename Удалить файл
 * @apiName DeleteUpload
 * @apiGroup ScreenUploads
 */
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Файл удален' });
    } else {
      res.status(404).json({ error: 'Файл не найден' });
    }
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
