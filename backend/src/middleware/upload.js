const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, '-');
    cb(null, `${ts}-${safe}`);
  },
});

const upload = multer({ storage });

module.exports = { upload, uploadsDir };
