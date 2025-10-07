const express = require('express');
const router = express.Router();
const { list, add, remove } = require('../controllers/mediaController');

// Listar todo
router.get('/', list);
// Agregar (nota: aquí es lógico usar multipart/form-data si subes archivos reales; por ahora usamos JSON)
router.post('/', add);
// Eliminar por id
router.delete('/:id', remove);

module.exports = router;