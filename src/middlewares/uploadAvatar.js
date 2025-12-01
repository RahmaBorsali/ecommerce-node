// src/middlewares/uploadAvatar.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dossier uploads/avatars à la racine du projet
const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');

// Création du dossier si besoin
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({ storage });

module.exports = uploadAvatar;
