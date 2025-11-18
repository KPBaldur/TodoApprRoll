import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";
import { scheduleAlarm } from "../services/schedulerService";

// Obtener todas las alarmas del usuario autenticado
export const getAlarms = async (req: AuthRequest, res: Response) => {
    try {
        const alarms = await prisma.alarm.findMany({
            where: { userId: req.userId },
            include: {
                audio: { select: { id: true, name: true, url: true } },
                image: { select: { id: true, name: true, url: true } },
            },
            orderBy: { createdAt: "desc"},
        });
        res.json(alarms);
    } catch (error) {
        console.error("Error al obtener alarmas:", error);
        res.status(500).json({ message: "Error al obtener alarmas" });
    }
};

// Crear una nueva alarma
export const createAlarm = async (req: AuthRequest, res: Response) => {
    try {
        const { name, audioId, imageId, scheduleAt, snoozeMins, cronExpr, enabled, enable } = req.body;

        if (!name)
            return res.status(400).json({ message: "El nombre de la alarma es obligatorio" });

        // Validar audioId si viene
        if (audioId) {
            const audio = await prisma.media.findFirst({
                where: { id: audioId, userId: req.userId },
            });
            if (!audio) {
                return res.status(404).json({ message: "Audio no encontrado" });
            }
        }

        // Validar imageId si viene
        if (imageId) {
            const image = await prisma.media.findFirst({
                where: { id: imageId, userId: req.userId },
            });
            if (!image) {
                return res.status(404).json({ message: "Imagen no encontrada" });
            }
        }

        // Unificar campo enabled (si viene "enable" desde el frontend, mapearlo)
        const normalizedEnabled: boolean =
            typeof enabled === "boolean"
                ? enabled
                : typeof enable === "boolean"
                ? enable
                : true;

        const alarm = await prisma.alarm.create({
            data: {
                userId: req.userId!,
                name,
                audioId,
                imageId,
                scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
                snoozeMins: snoozeMins ?? 5,
                cronExpr,
                enabled: normalizedEnabled,
            },
            include: { audio: { select: { url: true } } },
        });

        // Reprogramar inmediatamente tras crear
        scheduleAlarm(alarm);

        await logHistory(req.userId!, "Alarm", "CREATE", alarm);
        res.status(201).json(alarm);
    } catch (error) {
        console.error("Error al crear alarma:", error);
        res.status(500).json({ message: "Error al crear alarma" });
    }
};

// Actualizar una alarma existente
export const updateAlarm = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, audioId, imageId, scheduleAt, snoozeMins, enabled, enable, cronExpr } = req.body;

        const existing = await prisma.alarm.findFirst({
            where: { id, userId: req.userId },
        });

        if (!existing)
            return res.status(404).json({ message: "Alarma no encontrada" });

        // Validar audioId si viene definido (incluye strings vacíos o null explícito)
        if (typeof audioId !== "undefined" && audioId) {
            const audio = await prisma.media.findFirst({
                where: { id: audioId, userId: req.userId },
            });
            if (!audio) {
                return res.status(404).json({ message: "Audio no encontrado" });
            }
        }

        // Validar imageId si viene definido
        if (typeof imageId !== "undefined" && imageId) {
            const image = await prisma.media.findFirst({
                where: { id: imageId, userId: req.userId },
            });
            if (!image) {
                return res.status(404).json({ message: "Imagen no encontrada" });
            }
        }

        // Unificar campo enabled: mantener estado previo si no viene en body
        const normalizedEnabled: boolean =
            typeof enabled === "boolean"
                ? enabled
                : typeof enable === "boolean"
                ? enable
                : existing.enabled;

        const updated = await prisma.alarm.update({
            where: { id },
            data: {
                name,
                audioId: typeof audioId !== "undefined" ? (audioId || null) : undefined,
                imageId: typeof imageId !== "undefined" ? (imageId || null) : undefined,
                scheduleAt: typeof scheduleAt !== "undefined" ? (scheduleAt ? new Date(scheduleAt) : null) : undefined,
                snoozeMins,
                enabled: normalizedEnabled,
                cronExpr,
            },
            include: { audio: { select: { url: true } } },
        });

        // Reprogramar inmediatamente tras actualizar
        scheduleAlarm(updated);

        await logHistory(req.userId!, "Alarm", "UPDATE", updated);
        res.json(updated);
    } catch (error) {
        console.error("Error al actualizar alarma:", error);
        res.status(500).json({ message: "Error al actualizar alarma"});
    }
};

// Eliminar una alarma
export const deleteAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing)
      return res.status(404).json({ message: "Alarma no encontrada" });

    
    await prisma.alarm.delete({ where: { id } });
    await logHistory(req.userId!, "Alarm", "DELETE", existing);
    res.json({ message: "Alarma eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar alarma:", error);
    res.status(500).json({ message: "Error al eliminar alarma" });
  }
};

// Activar/desactivar una alarma rápidamente (toggle)
export const toggleAlarm = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const alarm = await prisma.alarm.findFirst({
            where: { id, userId: req.userId }
        });

        if (!alarm)
            return res.status(404).json({ message: "Alarma no encontrada" });

        const updated = await prisma.alarm.update({
            where: { id },
            data: { enabled: !alarm.enabled }
        });

        await logHistory(req.userId!, "Alarm", "TOGGLE", updated);
        res.json(updated);
    } catch (error) {
        console.error("Error al activar/desactivar alarma:", error);
        res.status(500).json({ message: "Error al modificar alarma" });
    }
};