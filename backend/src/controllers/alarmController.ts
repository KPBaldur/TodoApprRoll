import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/auth.middleware";

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
        const { name, audioId, imageId, scheduleAt, snoozeMins, enable}
    }
}