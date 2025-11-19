// Ajustes clave: validar payload, reprogramar en crear/editar/toggle,
// cancelar cuando se desactiva y consultar DB antes de programar
import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";
import { scheduleAlarm, cancelAlarm, validateCron } from "../services/schedulerService";

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
    const {
      name,
      scheduleAt,
      cronExpr,
      snoozeMins,
      audioId,
      imageId,
      enabled,
      enable,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const normalizedEnabled =
      typeof enable === "boolean" ? enable : typeof enabled === "boolean" ? enabled : true;

    // Validaciones de exclusión
    if (scheduleAt && cronExpr) {
      return res.status(400).json({ message: "Si hay scheduleAt, cronExpr debe ser null" });
    }
    if (!scheduleAt && !cronExpr) {
      return res.status(400).json({ message: "Debe definir fecha (scheduleAt) o cronExpr" });
    }

    if (cronExpr && cronExpr.trim() && !validateCron(cronExpr)) {
      return res.status(400).json({ message: "Expresión cron inválida" });
    }

    const alarm = await prisma.alarm.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        audioId: audioId || null,
        imageId: imageId || null,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
        snoozeMins: typeof snoozeMins === "number" ? snoozeMins : 5,
        cronExpr: cronExpr || null,
        enabled: normalizedEnabled,
      },
      include: { audio: { select: { url: true } } },
    });

    if (alarm.enabled) scheduleAlarm(alarm);

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
    const {
      name,
      audioId,
      imageId,
      scheduleAt,
      snoozeMins,
      cronExpr,
      enabled,
      enable,
    } = req.body;

    const existing = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
      include: { audio: { select: { url: true } } },
    });

    if (!existing) return res.status(404).json({ message: "Alarma no encontrada" });

    const normalizedEnabled =
      typeof enable === "boolean"
        ? enable
        : typeof enabled === "boolean"
        ? enabled
        : existing.enabled;

    if (scheduleAt && cronExpr) {
      return res.status(400).json({ message: "Si hay scheduleAt, cronExpr debe ser null" });
    }
    if (typeof cronExpr !== "undefined" && cronExpr && cronExpr.trim() && !validateCron(cronExpr)) {
      return res.status(400).json({ message: "Expresión cron inválida" });
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        name: typeof name !== "undefined" ? name : undefined,
        audioId: typeof audioId !== "undefined" ? (audioId || null) : undefined,
        imageId: typeof imageId !== "undefined" ? (imageId || null) : undefined,
        scheduleAt:
          typeof scheduleAt !== "undefined" ? (scheduleAt ? new Date(scheduleAt) : null) : undefined,
        snoozeMins: typeof snoozeMins !== "undefined" ? snoozeMins : undefined,
        cronExpr: typeof cronExpr !== "undefined" ? (cronExpr || null) : undefined,
        enabled: normalizedEnabled,
      },
      include: { audio: { select: { url: true } } },
    });

    // Reprogramar o cancelar de inmediato
    if (updated.enabled) {
      scheduleAlarm(updated);
    } else {
      cancelAlarm(updated.id);
    }

    await logHistory(req.userId!, "Alarm", "UPDATE", updated);
    res.json(updated);
  } catch (error) {
    console.error("Error al actualizar alarma:", error);
    res.status(500).json({ message: "Error al actualizar alarma" });
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
      where: { id, userId: req.userId },
      include: { audio: { select: { url: true } } },
    });

    if (!alarm) return res.status(404).json({ message: "Alarma no encontrada" });

    const updated = await prisma.alarm.update({
      where: { id },
      data: { enabled: !alarm.enabled },
      include: { audio: { select: { url: true } } },
    });

    if (updated.enabled) {
      scheduleAlarm(updated);
    } else {
      cancelAlarm(updated.id);
    }

    await logHistory(req.userId!, "Alarm", "TOGGLE", updated);
    res.json(updated);
  } catch (error) {
    console.error("Error al activar/desactivar alarma:", error);
    res.status(500).json({ message: "Error al modificar alarma" });
  }
};