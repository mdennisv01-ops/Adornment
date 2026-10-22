const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function destinationFor(subfolder) {
  const dir = path.join(process.cwd(), env.uploadDir, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeUploader(subfolder) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationFor(subfolder)),
    filename: (req, file, cb) => {
      const ext = MIME_EXTENSIONS[file.mimetype];
      cb(null, `${uuidv4()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(ApiError.badRequest('Only JPEG, PNG, or WEBP images are allowed'));
      }
      cb(null, true);
    },
  });
}

// Separate folders keep product photography, try-on source photos, and
// AI-generated results easy to reason about, back up, or purge separately.
const uploadProductImage = makeUploader('products');
const uploadTryOnPhoto = makeUploader('try-on-sources');
const uploadAvatar = makeUploader('avatars');

module.exports = { uploadProductImage, uploadTryOnPhoto, uploadAvatar };
