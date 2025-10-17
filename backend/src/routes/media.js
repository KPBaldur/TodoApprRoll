import express from 'express';
import { list, add, upload, remove, rename } from '../controllers/mediaController.js';
import { upload as uploadMw } from '../middleware/upload.js';

const router = express.Router();

// Listar todo
router.get('/', list);
// Agregar por JSON (URL existente)
router.post('/', add);
// Subir archivo real (multipart/form-data con campo "file")
router.post('/upload', uploadMw.single('file'), upload);
// Renombrar por id
router.put('/:id', rename);
// Eliminar por id
router.delete('/:id', remove);

export default router;