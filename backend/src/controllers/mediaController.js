/**
 * Controlador de Biblioteca Multimedia
 * Persistencia en media.json con items { id, type: 'audio'|'image'|'gif'|'mp3', name, path }
 */
const { v4: uuidv4 } = require('uuid');
const Storage = require('../services/storage');
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../middleware/upload');

function detectTypeByFile(file) {
  const mime = file?.mimetype || '';

  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.endsWith('/gif')) return 'image';
  return 'file';
}
function detectTypeByPath(p) {
  const ext = (p || '').toLowerCase();
  if (ext.endsWith('.mp3') || ext.endsWith('.wav') || ext.endsWith('.ogg')) return 'audio';
  if (ext.endsWith('.gif') || ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.webp')) return 'image';
  if (ext.endsWith('.mp4')) return 'video';
  return 'file';
}

const list = async (req, res, next) => {
  try {
    const media = await Storage.getMedia();
    res.json({ success: true, data: { media, count: media.length } });
  } catch (err) { next(err); }
};

// Alta por JSON (URL o path ya existente)
const add = async (req, res, next) => {
  try {
    const { type, name, path: filePath } = req.body;
    if (!name || !filePath) return res.status(400).json({ success: false, message: 'name y path son requeridos' });

    const media = await Storage.getMedia();
    const item = { id: uuidv4(), type: type || detectTypeByPath(filePath), name, path: filePath };
    media.push(item);
    await Storage.saveMedia(media);

    res.status(201).json({ success: true, message: 'Item agregado', data: { item } });
  } catch (err) { next(err); }
};

// Subida real de archivo (multipart/form-data con campo "file")
const upload = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No se recibió archivo' });

    // Validacion de seguridad de tipo de archivo
    const validMimes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4'
    ];

    if (!validMimes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de archivo no permitido (${file.mimetype}). Solo se aceptan mp3, wav, ogg, jpg, png, gif, webp, mp4`
      });
    }

    const customName = req.body?.name;
    const type = detectTypeByFile(file);
    const publicPath = `/uploads/${file.filename}`;
    const name = customName || file.originalname;

    const media = await Storage.getMedia();
    const item = { id: uuidv4(), type, name, path: publicPath };
    media.push(item);
    await Storage.saveMedia(media);

    res.status(201).json({ success: true, message: 'Archivo subido', data: { item } });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const media = await Storage.getMedia();
    const idx = media.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item no encontrado' });

    const item = media[idx];
    // Si el archivo está dentro de /uploads, eliminar del disco
    if (item.path && item.path.startsWith('/uploads/')) {
      const abs = path.join(uploadsDir, path.basename(item.path));
      if (fs.existsSync(abs)) {
        try { await fs.promises.unlink(abs); } catch (e) { /* ignorar */ }
      }
    }

    media.splice(idx, 1);
    await Storage.saveMedia(media);
    res.json({ success: true, message: 'Item eliminado' });
  } catch (err) { next(err); }
};

const rename = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ success: false, message: 'Nuevo nombre inválido' });

    const media = await Storage.getMedia();
    const idx = media.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item no encontrado' });

    media[idx].name = name;
    await Storage.saveMedia(media);

    res.json({ success: true, message: 'Item renombrado', data: { item: media[idx] } });
  } catch (err) { next(err); }
};

module.exports = { list, add, upload, remove, rename };