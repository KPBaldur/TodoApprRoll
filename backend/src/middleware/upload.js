import multer from 'multer';
import { fileURLToPath } from 'url';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para almacenamiento en memoria (para Cloudinary)
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  }
});

// Mantener uploadsDir para compatibilidad con código existente
export const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
