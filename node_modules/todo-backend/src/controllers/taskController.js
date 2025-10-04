/**
 * Controlador de Tareas
 * Maneja todas las operaciones CRUD de tareas
 */

const Task = require('../models/Task');
const { uploadSound, uploadImage } = require('../middleware/upload');

/**
 * Obtener todas las tareas del usuario actual
 * GET /api/tasks
 */
const getTasks = async (req, res) => {
    try {
        let tasks;

        // Los administradores pueden ver todas las tareas
        if (req.user.role === 'admin') {
            tasks = await Task.findAll();
        } else {
            // Los usuarios normales solo ven sus tareas
            tasks = await Task.findByUserId(req.user.id);
        }

        res.json({
            success: true,
            message: 'Tareas obtenidas exitosamente',
            data: {
                tasks,
                count: tasks.length
            }
        });

    } catch (error) {
        console.error('Error obteniendo tareas:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error al obtener tareas'
        });
    }
};

/**
 * Obtener una tarea específica por ID
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Verificar permisos: solo el propietario o admin pueden ver la tarea
        if (req.user.role !== 'admin' && task.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver esta tarea'
            });
        }

        res.json({
            success: true,
            message: 'Tarea obtenida exitosamente',
            data: {
                task
            }
        });

    } catch (error) {
        console.error('Error obteniendo tarea:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error al obtener tarea'
        });
    }
};

/**
 * Crear una nueva tarea
 * POST /api/tasks
 */
const createTask = async (req, res) => {
    try {
        const { title, description, priority, subtasks, alarm } = req.body;

        // Crear tarea asignada al usuario actual
        const task = await Task.create({
            title,
            description,
            priority,
            userId: req.user.id,
            subtasks,
            alarm
        });

        res.status(201).json({
            success: true,
            message: 'Tarea creada exitosamente',
            data: {
                task
            }
        });

    } catch (error) {
        console.error('Error creando tarea:', error.message);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Error al crear tarea'
        });
    }
};

/**
 * Actualizar una tarea
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, subtasks, alarm } = req.body;

        // Verificar que la tarea existe
        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Verificar permisos: solo el propietario o admin pueden actualizar
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para actualizar esta tarea'
            });
        }

        // Actualizar tarea
        const updatedTask = await Task.update(id, {
            title,
            description,
            status,
            priority,
            subtasks,
            alarm
        });

        res.json({
            success: true,
            message: 'Tarea actualizada exitosamente',
            data: {
                task: updatedTask
            }
        });

    } catch (error) {
        console.error('Error actualizando tarea:', error.message);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Error al actualizar tarea'
        });
    }
};

/**
 * Cambiar estado de una tarea (completar/pendiente)
 * PATCH /api/tasks/:id/toggle
 */
const toggleTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la tarea existe
        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar esta tarea'
            });
        }

        // Cambiar estado
        const updatedTask = await Task.toggleStatus(id);

        res.json({
            success: true,
            message: `Tarea marcada como ${updatedTask.status === 'completed' ? 'completada' : 'pendiente'}`,
            data: {
                task: updatedTask
            }
        });

    } catch (error) {
        console.error('Error cambiando estado de tarea:', error.message);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Error al cambiar estado de tarea'
        });
    }
};

/**
 * Eliminar una tarea
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la tarea existe
        const existingTask = await Task.findById(id);
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar esta tarea'
            });
        }

        // Eliminar tarea
        await Task.delete(id);

        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando tarea:', error.message);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Error al eliminar tarea'
        });
    }
};

// ====== ALARMAS ======
const updateAlarm = async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await Task.findById(id);
        if (!existingTask) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permisos' });
        }
        const { alarm } = req.body; // objeto alarm parcial o completo
        const updatedTask = await Task.update(id, { alarm });
        res.json({ success: true, message: 'Alarma actualizada', data: { task: updatedTask } });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Error al actualizar alarma' });
    }
};

const uploadAlarmSound = async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await Task.findById(id);
        if (!existingTask) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permisos' });
        }
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, message: 'Archivo MP3 requerido' });
        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/sounds/${file.filename}`;
        const alarm = { ...(existingTask.alarm || {}), soundUrl: publicUrl };
        const updatedTask = await Task.update(id, { alarm });
        res.status(201).json({ success: true, message: 'Sonido subido', data: { task: updatedTask, url: publicUrl } });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Error al subir sonido' });
    }
};

const uploadAlarmImage = async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await Task.findById(id);
        if (!existingTask) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permisos' });
        }
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, message: 'Archivo GIF requerido' });
        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/images/${file.filename}`;
        const alarm = { ...(existingTask.alarm || {}), imageUrl: publicUrl };
        const updatedTask = await Task.update(id, { alarm });
        res.status(201).json({ success: true, message: 'Imagen subida', data: { task: updatedTask, url: publicUrl } });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Error al subir imagen' });
    }
};

const snoozeAlarm = async (req, res) => {
    try {
        const { id } = req.params;
        const { minutes } = req.body;
        const m = Number(minutes) || 5;
        const existingTask = await Task.findById(id);
        if (!existingTask) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permisos' });
        }
        const now = Date.now();
        const nextTriggerAt = new Date(now + m * 60 * 1000).toISOString();
        const alarm = { ...(existingTask.alarm || {}), nextTriggerAt };
        const updatedTask = await Task.update(id, { alarm });
        res.json({ success: true, message: `Alarma pospuesta ${m} minutos`, data: { task: updatedTask } });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Error al posponer alarma' });
    }
};

const stopAlarm = async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await Task.findById(id);
        if (!existingTask) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        if (req.user.role !== 'admin' && existingTask.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tienes permisos' });
        }
        const alarm = { ...(existingTask.alarm || {}), nextTriggerAt: null, enabled: false };
        const updatedTask = await Task.update(id, { alarm });
        res.json({ success: true, message: 'Alarma detenida', data: { task: updatedTask } });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message || 'Error al detener alarma' });
    }
};

module.exports = {
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
};