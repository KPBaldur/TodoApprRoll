const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadBase = path.join(__dirname, '../uploads');

// Asegurar subcarpetas
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(path.join(uploadBase, 'sounds'));
ensureDir(path.join(uploadBase, 'images'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'misc';
    if (file.fieldname === 'sound') sub = 'sounds';
    if (file.fieldname === 'image') sub = 'images';
    const dest = path.join(uploadBase, sub);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'sound') {
    return cb(null, /\.mp3$/i.test(file.originalname));
  }
  if (file.fieldname === 'image') {
    return cb(null, /\.gif$/i.test(file.originalname));
  }
  cb(null, false);
};

const upload = multer({ storage, fileFilter });

module.exports = {
  uploadSound: upload.single('sound'),
  uploadImage: upload.single('image')
};