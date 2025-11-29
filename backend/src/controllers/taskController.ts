import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";

const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["pending", "working", "completed"];
const VALID_SUBTASK_STATUSES = ["pending", "cancelled", "completed"];

// Obtener tareas
export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority, search, sortBy, order, deleted, archived } = req.query;
        const userId = req.userId!;

        const where: any = { userId };

        // Soft Delete Logic
        if (deleted === 'true') {
            where.deleted = true;
        } else {
            where.deleted = false;
        }

        // Archiving Logic
        if (archived === 'true') {
            where.archived = true;
        } else if (deleted !== 'true') {
            // Default: hide archived unless specifically asked or viewing trash
            if (status !== 'archived') {
                where.archived = false;
            }
        }

        // Status Filter
        if (status && status !== 'all' && status !== 'archived') {
            where.status = String(status);
        }

        // Priority Filter
        if (priority && priority !== 'all') {
            where.priority = String(priority);
        }

        // Search
        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        // Sorting
        let orderBy: any = {};
        if (sortBy === 'priority') {
            // Priority is string, so this is alphabetical. 
            // Ideally we'd map low=1, medium=2, high=3 but for now string sort.
            orderBy = { priority: order === 'asc' ? 'asc' : 'desc' };
        } else if (sortBy === 'status') {
            orderBy = { status: order === 'asc' ? 'asc' : 'desc' };
        } else if (sortBy === 'order') {
            orderBy = { order: order === 'asc' ? 'asc' : 'desc' };
        } else {
            // Default: createdAt desc (newest first)
            orderBy = { createdAt: 'desc' };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                subtasks: { orderBy: { order: 'asc' } },
                alarm: true
            },
            orderBy: [orderBy, { createdAt: 'desc' }]
        });

        res.json(tasks);
    } catch (error) {
        console.error("Error getting tasks:", error);
        res.status(500).json({ message: "Error al obtener tareas" });
    }
};

// Crear Tarea
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, priority, status, alarmId } = req.body;
        const userId = req.userId!;

        if (!title || title.length < 3 || title.length > 100) {
            return res.status(400).json({ message: "El título es obligatorio (3-100 caracteres)" });
        }
        if (description && description.length > 1000) {
            return res.status(400).json({ message: "La descripción no puede exceder 1000 caracteres" });
        }
        if (priority && !VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({ message: "Prioridad inválida" });
        }
        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Estado inválido" });
        }

        let validAlarmId = null;
        if (alarmId) {
            const alarm = await prisma.alarm.findFirst({ where: { id: alarmId, userId } });
            if (!alarm) return res.status(400).json({ message: "Alarma no existe" });
            validAlarmId = alarmId;
        }

        const maxOrder = await prisma.task.findFirst({ where: { userId }, orderBy: { order: 'desc' } });
        const newOrder = (maxOrder?.order ?? 0) + 1;

        const task = await prisma.task.create({
            data: {
                userId,
                title,
                description,
                priority: priority || "medium",
                status: status || "pending",
                alarmId: validAlarmId,
                order: newOrder,
                completedAt: status === 'completed' ? new Date() : null
            }
        });

        await logHistory(userId, "Task", "CREATE", task);
        res.status(201).json(task);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Error al crear tarea" });
    }
};

// Actualizar Tarea
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status, alarmId, archived } = req.body;
        const userId = req.userId!;

        const existing = await prisma.task.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ message: "Tarea no encontrada" });

        if (existing.archived && archived !== false) {
            return res.status(400).json({ message: "No se puede modificar una tarea archivada. Desarchívela primero." });
        }

        const data: any = {};

        if (title) {
            if (title.length < 3 || title.length > 100) return res.status(400).json({ message: "Título inválido" });
            data.title = title;
        }
        if (description !== undefined) {
            if (description && description.length > 1000) return res.status(400).json({ message: "Descripción muy larga" });
            data.description = description;
        }
        if (priority) {
            if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ message: "Prioridad inválida" });
            data.priority = priority;
        }

        if (status) {
            if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: "Estado inválido" });
            data.status = status;

            if (status === 'completed' && existing.status !== 'completed') {
                data.completedAt = new Date();
            } else if (status !== 'completed' && existing.status === 'completed') {
                data.completedAt = null;
            }
        }

        if (alarmId !== undefined) {
            if (alarmId) {
                const alarm = await prisma.alarm.findFirst({ where: { id: alarmId, userId } });
                if (!alarm) return res.status(400).json({ message: "Alarma no existe" });
                data.alarmId = alarmId;
            } else {
                data.alarmId = null;
            }
        }

        if (archived === true) {
            if (existing.status !== 'completed' && data.status !== 'completed') {
                return res.status(400).json({ message: "Solo se pueden archivar tareas completadas" });
            }
            data.archived = true;
            data.archivedAt = new Date();
        } else if (archived === false) {
            data.archived = false;
            data.archivedAt = null;
        }

        const updated = await prisma.task.update({ where: { id }, data });
        await logHistory(userId, "Task", "UPDATE", updated);
        res.json(updated);

    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Error al actualizar tarea" });
    }
};

// Soft Delete
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const existing = await prisma.task.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ message: "Tarea no encontrada" });

        const updated = await prisma.task.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date() }
        });

        await logHistory(userId, "Task", "SOFT_DELETE", updated);
        res.json({ message: "Tarea enviada a la papelera" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar tarea" });
    }
};

// Restore
export const restoreTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const existing = await prisma.task.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ message: "Tarea no encontrada" });

        const updated = await prisma.task.update({
            where: { id },
            data: { deleted: false, deletedAt: null }
        });

        await logHistory(userId, "Task", "RESTORE", updated);
        res.json({ message: "Tarea restaurada" });
    } catch (error) {
        res.status(500).json({ message: "Error al restaurar tarea" });
    }
};

// Permanent Delete
export const permanentDeleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const existing = await prisma.task.findFirst({ where: { id, userId } });
        if (!existing) return res.status(404).json({ message: "Tarea no encontrada" });

        await prisma.task.delete({ where: { id } });
        await logHistory(userId, "Task", "PERMANENT_DELETE", existing);
        res.json({ message: "Tarea eliminada permanentemente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar tarea permanentemente" });
    }
};

// Subtasks
export const addSubtask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = req.userId!;

        if (!title) return res.status(400).json({ message: "Título requerido" });

        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

        const maxOrder = await prisma.subtask.findFirst({ where: { taskId: id }, orderBy: { order: 'desc' } });
        const newOrder = (maxOrder?.order ?? 0) + 1;

        const subtask = await prisma.subtask.create({
            data: {
                taskId: id,
                title,
                status: "pending",
                order: newOrder
            }
        });

        await logHistory(userId, "Subtask", "CREATE", subtask);
        res.status(201).json(subtask);
    } catch (error) {
        res.status(500).json({ message: "Error al crear subtarea" });
    }
};

export const updateSubtask = async (req: AuthRequest, res: Response) => {
    try {
        const { id, subtaskId } = req.params;
        const { title, status } = req.body;
        const userId = req.userId!;

        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

        const subtask = await prisma.subtask.findFirst({ where: { id: subtaskId, taskId: id } });
        if (!subtask) return res.status(404).json({ message: "Subtarea no encontrada" });

        const data: any = {};
        if (title) data.title = title;
        if (status) {
            if (!VALID_SUBTASK_STATUSES.includes(status)) return res.status(400).json({ message: "Estado inválido" });
            data.status = status;
            if (status === 'completed' && subtask.status !== 'completed') {
                data.completedAt = new Date();
            } else if (status !== 'completed') {
                data.completedAt = null;
            }
        }

        const updated = await prisma.subtask.update({ where: { id: subtaskId }, data });
        await logHistory(userId, "Subtask", "UPDATE", updated);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar subtarea" });
    }
};

export const deleteSubtask = async (req: AuthRequest, res: Response) => {
    try {
        const { id, subtaskId } = req.params;
        const userId = req.userId!;

        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

        await prisma.subtask.delete({ where: { id: subtaskId } });
        res.json({ message: "Subtarea eliminada" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar subtarea" });
    }
};

export const reorderTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { tasks } = req.body;
        const userId = req.userId!;
        if (!Array.isArray(tasks)) return res.status(400).json({ message: "Invalid format" });

        await prisma.$transaction(
            tasks.map((t: any) => prisma.task.updateMany({
                where: { id: t.id, userId },
                data: { order: t.order }
            }))
        );
        res.json({ message: "Orden actualizado" });
    } catch (error) {
        res.status(500).json({ message: "Error reordering" });
    }
};

export const reorderSubtasks = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { subtasks } = req.body;
        const userId = req.userId!;

        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

        await prisma.$transaction(
            subtasks.map((s: any) => prisma.subtask.updateMany({
                where: { id: s.id, taskId: id },
                data: { order: s.order }
            }))
        );
        res.json({ message: "Orden actualizado" });
    } catch (error) {
        res.status(500).json({ message: "Error reordering" });
    }
};