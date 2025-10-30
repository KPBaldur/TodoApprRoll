import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";

// Obtener las tareas con el usuario autenticado
export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { userId: req.userId },
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
        const { title, description, priority, status } = req.body;

        if (!title) {
            return res.status(400).json({ message: "El titulo es obligatorio" });
        }

        const task = await prisma.task.create({
            data: {
                userId: req.userId!,
                title,
                description,
                priority: priority || "medium",
                status: status || "pending",
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
        const { title, description, priority, status } = req.body;

        const existing = await prisma.task.findFirst({
            where: { id, userId: req.userId},
        });

        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });

        const updated = await prisma.task.update({
            where: { id},
            data: { title, description, priority, status },
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