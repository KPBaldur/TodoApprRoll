const express = require('express');
const router = express.Router();
const { list, add, upload, remove, rename } = require('../controllers/mediaController');
const { upload: uploadMw } = require('../middleware/upload');

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

module.exports = router;