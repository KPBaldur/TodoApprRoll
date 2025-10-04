/**
 * Modelo de Tarea
 * Define la estructura y operaciones para las tareas del sistema
 */

const { v4: uuidv4 } = require('uuid');
const Database = require('./Database');

class Task {
    constructor(taskData) {
        this.id = taskData.id || uuidv4();
        this.title = taskData.title;
        this.description = taskData.description || '';
        this.status = taskData.status || 'pending'; // 'pending', 'working', 'completed'
        this.priority = taskData.priority || 'medium'; // 'low', 'medium', 'high'
        this.userId = taskData.userId; // ID del usuario propietario
        this.createdAt = taskData.createdAt || new Date().toISOString();
        this.updatedAt = taskData.updatedAt || new Date().toISOString();
        // Fecha de término cuando se marca como completada
        this.completedAt = taskData.completedAt; // ISO string opcional

        // Subtareas
        this.subtasks = Array.isArray(taskData.subtasks) ? taskData.subtasks : [];

        // Configuración de alarma
        this.alarm = taskData.alarm || undefined;
    }

    /**
     * Validar datos de la tarea
     */
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length < 3) {
            errors.push('El título debe tener al menos 3 caracteres');
        }

        if (!this.userId) {
            errors.push('La tarea debe tener un usuario asignado');
        }

        if (!['pending', 'working', 'completed'].includes(this.status)) {
            errors.push('El estado debe ser "pending", "working" o "completed"');
        }

        if (!['low', 'medium', 'high'].includes(this.priority)) {
            errors.push('La prioridad debe ser "low", "medium" o "high"');
        }

        // Validación básica de subtareas
        if (typeof this.subtasks !== 'undefined') {
            if (!Array.isArray(this.subtasks)) {
                errors.push('Las subtareas deben ser un arreglo');
            } else {
                for (const st of this.subtasks) {
                    if (!st || typeof st.title !== 'string' || st.title.trim().length === 0) {
                        errors.push('Cada subtarea debe tener un título');
                        break;
                    }
                    if (typeof st.completed !== 'undefined' && typeof st.completed !== 'boolean') {
                        errors.push('El campo "completed" de la subtarea debe ser booleano');
                        break;
                    }
                }
            }
        }

        // Validación básica de alarmas
        if (typeof this.alarm !== 'undefined') {
            if (typeof this.alarm !== 'object') {
                errors.push('La alarma debe ser un objeto');
            } else {
                const a = this.alarm;
                if (typeof a.enabled !== 'undefined' && typeof a.enabled !== 'boolean') {
                    errors.push('El campo "enabled" de la alarma debe ser booleano');
                }
                if (typeof a.soundUrl !== 'undefined' && typeof a.soundUrl !== 'string') {
                    errors.push('El campo "soundUrl" de la alarma debe ser string');
                }
                if (typeof a.imageUrl !== 'undefined' && typeof a.imageUrl !== 'string') {
                    errors.push('El campo "imageUrl" de la alarma debe ser string');
                }
                if (typeof a.schedule !== 'undefined') {
                    const s = a.schedule;
                    const types = ['once', 'daily', 'weekly', 'interval'];
                    if (!s || !types.includes(s.type)) {
                        errors.push('El tipo de schedule debe ser "once", "daily", "weekly" o "interval"');
                    }
                    if (s.type === 'interval' && (typeof s.intervalMinutes !== 'number' || s.intervalMinutes <= 0)) {
                        errors.push('intervalMinutes debe ser un número mayor a 0');
                    }
                    if (s.type === 'daily' && typeof s.time !== 'string') {
                        errors.push('Para daily debes especificar "time" (HH:mm)');
                    }
                    if (s.type === 'weekly' && (typeof s.dayOfWeek !== 'number' || s.dayOfWeek < 0 || s.dayOfWeek > 6 || typeof s.time !== 'string')) {
                        errors.push('Para weekly debes especificar "dayOfWeek" (0-6) y "time" (HH:mm)');
                    }
                    if (s.type === 'once' && typeof s.dateTime !== 'string') {
                        errors.push('Para once debes especificar "dateTime" (ISO string)');
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Actualizar timestamp de modificación
     */
    touch() {
        this.updatedAt = new Date().toISOString();
    }

    // ===================
    // MÉTODOS ESTÁTICOS
    // ===================

    /**
     * Crear una nueva tarea
     */
    static async create(taskData) {
        const task = new Task(taskData);
        
        // Validar datos
        const validation = task.validate();
        if (!validation.isValid) {
            throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
        }

        // Guardar en la base de datos
        await Database.createTask(task);
        
        return task;
    }

    /**
     * Buscar tarea por ID
     */
    static async findById(id) {
        const taskData = await Database.findTaskById(id);
        return taskData ? new Task(taskData) : null;
    }

    /**
     * Buscar tareas por usuario
     */
    static async findByUserId(userId) {
        const tasks = await Database.findTasksByUserId(userId);
        return tasks.map(taskData => new Task(taskData));
    }

    /**
     * Obtener todas las tareas (solo para admins)
     */
    static async findAll() {
        const tasks = await Database.getTasks();
        return tasks.map(taskData => new Task(taskData));
    }

    /**
     * Actualizar una tarea
     */
    static async update(id, updateData) {
        const existingTask = await Task.findById(id);
        if (!existingTask) {
            throw new Error('Tarea no encontrada');
        }

        // Detectar cambio de estado para ajustar completedAt
        const isStatusChange = typeof updateData.status !== 'undefined' && updateData.status !== existingTask.status;

        const updatedTaskData = { ...existingTask, ...updateData };

        if (isStatusChange) {
            if (updateData.status === 'completed') {
                updatedTaskData.completedAt = new Date().toISOString();
            } else {
                // Al salir de "completed", limpiamos completedAt
                updatedTaskData.completedAt = undefined;
            }
        }

        // Asegurar que subtasks sea arreglo si viene en updateData
        if (typeof updateData.subtasks !== 'undefined') {
            if (!Array.isArray(updateData.subtasks)) {
                throw new Error('Las subtareas deben ser un arreglo');
            }
            updatedTaskData.subtasks = updateData.subtasks;
        }

        // Asegurar que alarm sea objeto si viene en updateData
        if (typeof updateData.alarm !== 'undefined') {
            if (updateData.alarm !== null && typeof updateData.alarm !== 'object') {
                throw new Error('La alarma debe ser un objeto o null');
            }
            updatedTaskData.alarm = updateData.alarm;
        }

        const updatedTask = new Task(updatedTaskData);
        updatedTask.touch();

        // Validar
        const validation = updatedTask.validate();
        if (!validation.isValid) {
            throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
        }

        // Actualizar en la base de datos
        await Database.updateTask(id, updatedTask);
        
        return updatedTask;
    }

    /**
     * Eliminar una tarea
     */
    static async delete(id) {
        const task = await Task.findById(id);
        if (!task) {
            throw new Error('Tarea no encontrada');
        }

        await Database.deleteTask(id);
        return true;
    }

    /**
     * Cambiar estado de una tarea
     */
    static async toggleStatus(id) {
        const task = await Task.findById(id);
        if (!task) {
            throw new Error('Tarea no encontrada');
        }

        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        return await Task.update(id, { status: newStatus });
    }
}

module.exports = Task;