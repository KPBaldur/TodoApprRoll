// Router de Tareas
const express = require('express');
const router = express.Router();

const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    updateAlarm,
    uploadAlarmSound,
    uploadAlarmImage,
    snoozeAlarm,
    stopAlarm
} = require('../controllers/taskController');

const { authenticateToken } = require('../middleware/auth');
const { uploadSound, uploadImage } = require('../middleware/upload');

// Listar tareas (usuario ve las suyas; admin ve todas)
router.get('/', authenticateToken, getTasks);

// Obtener una tarea por ID (propietario o admin)
router.get('/:id', authenticateToken, getTaskById);

// Crear una nueva tarea (del usuario autenticado)
router.post('/', authenticateToken, createTask);

// Actualizar una tarea por ID (propietario o admin)
router.put('/:id', authenticateToken, updateTask);

// Cambiar estado de una tarea (propietario o admin)
router.patch('/:id/toggle', authenticateToken, toggleTaskStatus);

// Eliminar una tarea (propietario o admin)
router.delete('/:id', authenticateToken, deleteTask);

// ====== ALARMAS ======
// Actualizar configuración de la alarma (enabled, schedule, nextTriggerAt)
router.patch('/:id/alarm', authenticateToken, updateAlarm);

// Subir sonido MP3 para la alarma
router.post('/:id/alarm/sound', authenticateToken, uploadSound, uploadAlarmSound);

// Subir imagen GIF para la alarma
router.post('/:id/alarm/image', authenticateToken, uploadImage, uploadAlarmImage);

// Posponer alarma X minutos
router.post('/:id/alarm/snooze', authenticateToken, snoozeAlarm);

// Detener alarma (desactivar y limpiar nextTriggerAt)
router.post('/:id/alarm/stop', authenticateToken, stopAlarm);

module.exports = router;