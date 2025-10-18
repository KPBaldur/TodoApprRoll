/**
 * Controlador de Biblioteca Multimedia
 * Persistencia en media.json con items { id, type: 'audio'|'image'|'gif'|'mp3', name, path }
 * Ahora usa Cloudinary para almacenamiento de archivos
 */
import { v4 as uuidv4 } from 'uuid';
import Storage from '../services/storage.js';
import { v2 as cloudinary } from 'cloudinary';

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
    const name = customName || file.originalname;

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        resource_type: 'auto',
        folder: 'todoapp-media',
        public_id: `${Date.now()}-${name.replace(/\s+/g, '-')}`,
        overwrite: false
      }
    );

    const media = await Storage.getMedia();
    const item = { 
      id: uuidv4(), 
      type, 
      name, 
      path: result.secure_url,
      cloudinaryId: result.public_id
    };
    media.push(item);
    await Storage.saveMedia(media);

    res.status(201).json({ success: true, message: 'Archivo subido a Cloudinary', data: { item } });
  } catch (err) { 
    console.error('Error uploading to Cloudinary:', err);
    next(err); 
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const media = await Storage.getMedia();
    const idx = media.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item no encontrado' });

    const item = media[idx];
    
    // Si tiene cloudinaryId, eliminar de Cloudinary
    if (item.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(item.cloudinaryId);
        console.log(`Archivo eliminado de Cloudinary: ${item.cloudinaryId}`);
      } catch (cloudinaryErr) {
        console.error('Error eliminando de Cloudinary:', cloudinaryErr);
        // Continuar con la eliminación local aunque falle Cloudinary
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

export { list, add, upload, remove, rename };