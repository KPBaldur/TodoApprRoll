import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  archiveTask,
  unarchiveTask
} from '../controllers/taskController.js';

const router = express.Router();

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
// Archivar y restaurar
router.patch('/:id/archive', archiveTask);
router.patch('/:id/unarchive', unarchiveTask);
// Eliminar
router.delete('/:id', deleteTask);

export default router;