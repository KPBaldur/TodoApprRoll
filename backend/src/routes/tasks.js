const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask
} = require('../controllers/taskcontroller');

// Listar
router.get('/', getTasks);
// Detalle
router.get('/:id', getTaskById);
// Crear
router.post('/', createTask);
// Actualizar
router.put('/:id', updateTask);
// Cambiar estado (ciclo pending -> working -> completed -> pending)
router.patch('/:id/toggle', toggleTaskStatus);
// Eliminar
router.delete('/:id', deleteTask);

module.exports = router;