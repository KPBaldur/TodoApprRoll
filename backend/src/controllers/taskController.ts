import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";

// Obtener las tareas con el usuario autenticado
export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { userId: req.userId },
            include: { subtasks: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(tasks);
    } catch (error) {
        console.error("Error al obtener tareas:", error);
        res.status(500).json({ message: "Error al obtener tareas" });
    }
};

// Crear tarea
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, priority, status, alarmId } = req.body;

        if (!title) {
            return res.status(400).json({ message: "El titulo es obligatorio" });
        }

        let normalizedAlarmId: string | undefined;
        if (alarmId) {
            const alarm = await prisma.alarm.findFirst({
                where: { id: alarmId, userId: req.userId },
            });
            if (!alarm) {
                return res.status(404).json({ message: "La alarma seleccionada no existe" });
            }
            normalizedAlarmId = alarmId;
        }

        const task = await prisma.task.create({
            data: {
                userId: req.userId!,
                title,
                description,
                priority: priority || "medium",
                status: status || "pending",
                alarmId: normalizedAlarmId,
            },
        });

        await logHistory(req.userId!, "Task", "CREATE", task);
        res.status(201).json(task);
    } catch (error) {
        console.error("Error al crear la tarea:", error);
        res.status(500).json({ message: "Error al crear la tarea" });
    }
};

// Actualizar tarea
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status, alarmId } = req.body;

        const existing = await prisma.task.findFirst({
            where: { id, userId: req.userId},
        });

        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });

        const data: {
            title?: string;
            description?: string | null;
            priority?: string;
            status?: string;
            alarmId?: string | null;
        } = { title, description, priority, status };

        if (alarmId === null || alarmId === "") {
            data.alarmId = null;
        } else if (typeof alarmId !== "undefined") {
            const alarm = await prisma.alarm.findFirst({
                where: { id: alarmId, userId: req.userId },
            });

            if (!alarm) {
                return res.status(404).json({ message: "La alarma seleccionada no existe" });
            }

            data.alarmId = alarmId;
        }

        const updated = await prisma.task.update({
            where: { id},
            data,
        });

        await logHistory(req.userId!, "Task", "UPDATE", updated);
        res.json(updated);
    } catch (error) {
        console.error("Error al actualizar la tarea:", error);
        res.status(500).json({ message: "Error al actualizar la tarea"});
    }
};

// Eliminar una tarea
export const deleteTask = async ( req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.task.findFirst({
            where: { id, userId: req.userId },
        });

        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });

        await prisma.task.delete({ where: { id }});
        await logHistory(req.userId!, "Task", "DELETE", existing);
        res.json({ message: "Tarea eliminada correctamente"});
    } catch (error) {
        console.error("Error al eliminar tarea: ", error);
        res.status(500).json({ message: "Error al eliminar tarea"});
    }
};

export const linkAlarmToTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { alarmId } = req.body;

        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId },
        });

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        if (!alarmId) {
            const updated = await prisma.task.update({
                where: { id },
                data: { alarmId: null },
            });
            await logHistory(req.userId!, "Task", "LINK_ALARM", updated);
            return res.json(updated);
        }

        const alarm = await prisma.alarm.findFirst({
            where: { id: alarmId, userId: req.userId },
        });

        if (!alarm) {
            return res.status(404).json({ message: "Alarma no encontrada" });
        }

        const updated = await prisma.task.update({
            where: { id },
            data: { alarmId },
        });

        await logHistory(req.userId!, "Task", "LINK_ALARM", { taskId: id, alarmId });
        res.json(updated);
    } catch (error) {
        console.error("Error al vincular alarma:", error);
        res.status(500).json({ message: "Error al vincular alarma con la tarea" });
    }
};

// Agregar subtarea
export const addSubtask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "El título de la subtarea es obligatorio" });
        }

        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId },
        });

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        const subtask = await prisma.subtask.create({
            data: {
                taskId: id,
                title: title.trim(),
                done: false,
            },
        });

        await logHistory(req.userId!, "Subtask", "CREATE", subtask);
        res.status(201).json(subtask);
    } catch (error) {
        console.error("Error al crear subtarea:", error);
        res.status(500).json({ message: "Error al crear subtarea" });
    }
};

// Toggle subtarea (marcar como completada/pendiente)
export const toggleSubtask = async (req: AuthRequest, res: Response) => {
    try {
        const { id, subtaskId } = req.params;
        const { done } = req.body;

        if (typeof done !== "boolean") {
            return res.status(400).json({ message: "El campo 'done' debe ser un booleano" });
        }

        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId },
        });

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId, taskId: id },
        });

        if (!subtask) {
            return res.status(404).json({ message: "Subtarea no encontrada" });
        }

        const updated = await prisma.subtask.update({
            where: { id: subtaskId },
            data: { done },
        });

        await logHistory(req.userId!, "Subtask", "UPDATE", updated);
        res.json(updated);
    } catch (error) {
        console.error("Error al actualizar subtarea:", error);
        res.status(500).json({ message: "Error al actualizar subtarea" });
    }
};

// Eliminar subtarea
export const deleteSubtask = async (req: AuthRequest, res: Response) => {
    try {
        const { id, subtaskId } = req.params;

        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId },
        });

        if (!task) {
            return res.status(404).json({ message: "Tarea no encontrada" });
        }

        const subtask = await prisma.subtask.findFirst({
            where: { id: subtaskId, taskId: id },
        });

        if (!subtask) {
            return res.status(404).json({ message: "Subtarea no encontrada" });
        }

        await prisma.subtask.delete({
            where: { id: subtaskId },
        });

        await logHistory(req.userId!, "Subtask", "DELETE", subtask);
        res.json({ message: "Subtarea eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar subtarea:", error);
        res.status(500).json({ message: "Error al eliminar subtarea" });
    }
};