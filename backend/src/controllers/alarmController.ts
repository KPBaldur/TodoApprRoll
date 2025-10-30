import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "@services/historyService";

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
        const { name, audioId, imageId, scheduleAt, snoozeMins, cronExpr } = req.body;

        if (!name)
            return res.status(400).json({ message: "El nombre de la alarma es obligatorio" });

        const alarm = await prisma.alarm.create({
            data: {
                userId: req.userId!,
                name,
                audioId,
                imageId,
                scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
                snoozeMins: snoozeMins || 5,
                cronExpr,
                enabled: true,
            },
        });

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
        const { name, audioId, imageId, scheduleAt, snoozeMins, enable, cronExpr } = req.body;

        const existing = await prisma.alarm.findFirst({
            where: { id, userId: req.userId },
        });

        if (!existing)
            return res.status(404).json({ message: "Alarma no encontrada" });

        const updated = await prisma.alarm.update({
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