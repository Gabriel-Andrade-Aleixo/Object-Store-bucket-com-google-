const multer = require('multer');
const config = require('../config/config');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: config.maxFilesPerUpload },
  fileFilter: (_request, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error(`Formato não permitido: ${file.originalname}.`);
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});
