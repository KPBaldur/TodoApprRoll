"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAlarm = exports.updateAlarm = exports.createAlarm = exports.getAlarms = void 0;
const prismaService_1 = __importDefault(require("../services/prismaService"));
const historyService_1 = require("../services/historyService");
// Obtener todas las alarmas del usuario autenticado
const getAlarms = async (req, res) => {
    try {
        const alarms = await prismaService_1.default.alarm.findMany({
            where: { userId: req.userId },
            include: {
                audio: { select: { id: true, name: true, url: true } },
                image: { select: { id: true, name: true, url: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(alarms);
    }
    catch (error) {
        console.error("Error al obtener alarmas:", error);
        res.status(500).json({ message: "Error al obtener alarmas" });
    }
};
exports.getAlarms = getAlarms;
// Crear una nueva alarma
const createAlarm = async (req, res) => {
    try {
        const { name, audioId, imageId, scheduleAt, snoozeMins, cronExpr } = req.body;
        if (!name)
            return res.status(400).json({ message: "El nombre de la alarma es obligatorio" });
        const alarm = await prismaService_1.default.alarm.create({
            data: {
                userId: req.userId,
                name,
                audioId,
                imageId,
                scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
                snoozeMins: snoozeMins || 5,
                cronExpr,
                enabled: true,
            },
        });
        await (0, historyService_1.logHistory)(req.userId, "Alarm", "CREATE", alarm);
        res.status(201).json(alarm);
    }
    catch (error) {
        console.error("Error al crear alarma:", error);
        res.status(500).json({ message: "Error al crear alarma" });
    }
};
exports.createAlarm = createAlarm;
// Actualizar una alarma existente
const updateAlarm = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, audioId, imageId, scheduleAt, snoozeMins, enable, cronExpr } = req.body;
        const existing = await prismaService_1.default.alarm.findFirst({
            where: { id, userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: "Alarma no encontrada" });
        const updated = await prismaService_1.default.alarm.update({
            where: { id },
            data: {
                name,
                audioId,
                imageId,
                scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
                snoozeMins,
                enabled: enable || false,
                cronExpr,
            },
        });
        await (0, historyService_1.logHistory)(req.userId, "Alarm", "UPDATE", updated);
        res.json(updated);
    }
    catch (error) {
        console.error("Error al actualizar alarma:", error);
        res.status(500).json({ message: "Error al actualizar alarma" });
    }
};
exports.updateAlarm = updateAlarm;
// Eliminar una alarma
const deleteAlarm = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prismaService_1.default.alarm.findFirst({
            where: { id, userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: "Alarma no encontrada" });
        await prismaService_1.default.alarm.delete({ where: { id } });
        await (0, historyService_1.logHistory)(req.userId, "Alarm", "DELETE", existing);
        res.json({ message: "Alarma eliminada correctamente" });
    }
    catch (error) {
        console.error("Error al eliminar alarma:", error);
        res.status(500).json({ message: "Error al eliminar alarma" });
    }
};
exports.deleteAlarm = deleteAlarm;
