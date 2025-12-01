import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";

// Obtener las tareas con el usuario autenticado
export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority, search, sortBy, order } = req.query;

        const where: any = { userId: req.userId };

        // Filtro por estado
        if (status && status !== "all") {
            where.status = String(status).toLowerCase();
        } else {
            // Si es "all", NO filtramos nada (trae todo, incluyendo archived)
            if (status === "all") {
                // No agregar filtro, trae todas
            }
            // Si no se pide explícitamente "archived" (y no es "all"), excluimos las archivadas por defecto
            else if (status !== "archived") {
                where.status = { not: "archived" };
            }
        }

        // Filtro por prioridad
        if (priority && priority !== "all") {
            where.priority = String(priority).toLowerCase();
        }

        // Búsqueda por título
        if (search) {
            where.title = { contains: String(search), mode: "insensitive" };
        }

        // Ordenamiento
        let orderBy: any = {};
        if (sortBy === "priority") {
            // Prioridad es string, así que el orden alfabético puede no ser el deseado (high, low, medium).
            // Para un ordenamiento real por prioridad se necesitaría un mapeo o enum en DB.
            // Por ahora ordenamos por string.
            orderBy = { priority: order === "asc" ? "asc" : "desc" };
        } else if (sortBy === "status") {
            orderBy = { status: order === "asc" ? "asc" : "desc" };
        } else if (sortBy === "order") {
            orderBy = { order: order === "asc" ? "asc" : "desc" };
        } else {
            // Default: createdAt
            orderBy = { createdAt: order === "asc" ? "asc" : "desc" };
        }

        // Siempre incluir ordenamiento secundario por fecha para consistencia
        const finalOrderBy = [orderBy, { createdAt: "desc" }];

        const tasks = await prisma.task.findMany({
            where,
            include: {
                subtasks: {
                    orderBy: { order: 'asc' } // Subtareas ordenadas por orden manual
                }
            },
            orderBy: finalOrderBy,
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

        // Obtener el último orden para poner la nueva al final (o al principio si se prefiere)
        // Aquí la ponemos al principio (orden más bajo o simplemente 0 si no hay lógica compleja)
        // O podemos buscar el max order.
        const maxOrderTask = await prisma.task.findFirst({
            where: { userId: req.userId },
            orderBy: { order: 'desc' }
        });
        const newOrder = (maxOrderTask?.order ?? 0) + 1;

        const task = await prisma.task.create({
            data: {
                userId: req.userId!,
                title,
                description,
                priority: priority || "medium",
                status: status || "pending",
                alarmId: normalizedAlarmId,
                order: newOrder,
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
            where: { id, userId: req.userId },
        });

        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });

        const data: any = { title, description, priority, status };

        // Lógica de completedAt
        if (status) {
            if (status === "completed" && existing.status !== "completed") {
                data.completedAt = new Date();
            } else if (status !== "completed" && status !== "archived" && existing.status === "completed") {
                // Solo limpiar fecha si NO es completed Y NO es archived
                data.completedAt = null;
            }
        }

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
            where: { id },
            data,
        });

        await logHistory(req.userId!, "Task", "UPDATE", updated);
        res.json(updated);
    } catch (error) {
        console.error("Error al actualizar la tarea:", error);
        res.status(500).json({ message: "Error al actualizar la tarea" });
    }
};

// Eliminar una tarea
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.task.findFirst({
            where: { id, userId: req.userId },
        });

        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });

        await prisma.task.delete({ where: { id } });
        await logHistory(req.userId!, "Task", "DELETE", existing);
        res.json({ message: "Tarea eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar tarea: ", error);
        res.status(500).json({ message: "Error al eliminar tarea" });
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

        // Obtener max order para subtareas
        const maxOrderSub = await prisma.subtask.findFirst({
            where: { taskId: id },
            orderBy: { order: 'desc' }
        });
        const newOrder = (maxOrderSub?.order ?? 0) + 1;

        const subtask = await prisma.subtask.create({
            data: {
                taskId: id,
                title: title.trim(),
                done: false,
                order: newOrder,
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

// Reordenar tareas
export const reorderTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { tasks } = req.body; // Array de { id, order }

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ message: "Formato inválido" });
        }

        // Transacción para actualizar todos
        await prisma.$transaction(
            tasks.map((t: any) =>
                prisma.task.updateMany({
                    where: { id: t.id, userId: req.userId },
                    data: { order: t.order }
                })
            )
        );

        res.json({ message: "Orden actualizado" });
    } catch (error) {
        console.error("Error al reordenar tareas:", error);
        res.status(500).json({ message: "Error al reordenar tareas" });
    }
};

// Reordenar subtareas
export const reorderSubtasks = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // Task ID
        const { subtasks } = req.body; // Array de { id, order }

        if (!Array.isArray(subtasks)) {
            return res.status(400).json({ message: "Formato inválido" });
        }

        // Verificar propiedad de la tarea
        const task = await prisma.task.findFirst({
            where: { id, userId: req.userId }
        });

        if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

        await prisma.$transaction(
            subtasks.map((s: any) =>
                prisma.subtask.updateMany({
                    where: { id: s.id, taskId: id },
                    data: { order: s.order }
                })
            )
        );

        res.json({ message: "Orden de subtareas actualizado" });
    } catch (error) {
        console.error("Error al reordenar subtareas:", error);
        res.status(500).json({ message: "Error al reordenar subtareas" });
    }
};

// Archivar todas las tareas completadas
export const archiveCompletedTasks = async (req: AuthRequest, res: Response) => {
    try {
        const result = await prisma.task.updateMany({
            where: {
                userId: req.userId,
                status: "completed"
            },
            data: {
                status: "archived"
            }
        });

        await logHistory(req.userId!, "Task", "BULK_ARCHIVE", { count: result.count });
        res.json({ message: `Se han archivado ${result.count} tareas completadas.`, count: result.count });
    } catch (error) {
        console.error("Error al archivar tareas completadas:", error);
        res.status(500).json({ message: "Error al archivar tareas completadas" });
    }
};