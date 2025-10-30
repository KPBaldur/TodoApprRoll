"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const prismaService_1 = __importDefault(require("../services/prismaService"));
const historyService_1 = require("../services/historyService");
// Obtener las tareas con el usuario autenticado
const getTasks = async (req, res) => {
    try {
        const tasks = await prismaService_1.default.task.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: "desc" },
        });
        res.json(tasks);
    }
    catch (error) {
        console.error("Error al obtener tareas:", error);
        res.status(500).json({ message: "Error al obtener tareas" });
    }
};
exports.getTasks = getTasks;
// Crear tarea
const createTask = async (req, res) => {
    try {
        const { title, description, priority, status } = req.body;
        if (!title) {
            return res.status(400).json({ message: "El titulo es obligatorio" });
        }
        const task = await prismaService_1.default.task.create({
            data: {
                userId: req.userId,
                title,
                description,
                priority: priority || "medium",
                status: status || "pending",
            },
        });
        await (0, historyService_1.logHistory)(req.userId, "Task", "CREATE", task);
        res.status(201).json(task);
    }
    catch (error) {
        console.error("Error al crear la tarea:", error);
        res.status(500).json({ message: "Error al crear la tarea" });
    }
};
exports.createTask = createTask;
// Actualizar tarea
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status } = req.body;
        const existing = await prismaService_1.default.task.findFirst({
            where: { id, userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });
        const updated = await prismaService_1.default.task.update({
            where: { id },
            data: { title, description, priority, status },
        });
        await (0, historyService_1.logHistory)(req.userId, "Task", "UPDATE", updated);
        res.json(updated);
    }
    catch (error) {
        console.error("Error al actualizar la tarea:", error);
        res.status(500).json({ message: "Error al actualizar la tarea" });
    }
};
exports.updateTask = updateTask;
// Eliminar una tarea
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prismaService_1.default.task.findFirst({
            where: { id, userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: "Tarea no encontrada" });
        await prismaService_1.default.task.delete({ where: { id } });
        await (0, historyService_1.logHistory)(req.userId, "Task", "DELETE", existing);
        res.json({ message: "Tarea eliminada correctamente" });
    }
    catch (error) {
        console.error("Error al eliminar tarea: ", error);
        res.status(500).json({ message: "Error al eliminar tarea" });
    }
};
exports.deleteTask = deleteTask;
