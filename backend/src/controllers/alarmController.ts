// backend/src/controllers/alarmController.ts
// Controlador de alarmas SOLO Pomodoro

import { Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";
import { scheduleAlarm, cancelAlarm } from "../services/schedulerService";

// Obtener todas las alarmas del usuario autenticado
export const getAlarms = async (req: AuthRequest, res: Response) => {
  try {
    const alarms = await prisma.alarm.findMany({
      where: { userId: req.userId },
      include: {
        audio: { select: { id: true, name: true, url: true } },
        image: { select: { id: true, name: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(alarms);
  } catch (error) {
    console.error("Error al obtener alarmas:", error);
    res.status(500).json({ message: "Error al obtener alarmas" });
  }
};

// Crear una nueva alarma Pomodoro
export const createAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { name, snoozeMins, audioId, imageId, enabled } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const effectiveSnooze =
      typeof snoozeMins === "number" && snoozeMins > 0 ? snoozeMins : 25;

    const normalizedEnabled =
      typeof enabled === "boolean" ? enabled : true;

    // Primera ejecución: ahora + snoozeMins
    const firstScheduleAt = normalizedEnabled
      ? new Date(Date.now() + effectiveSnooze * 60000)
      : null;

    const alarm = await prisma.alarm.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        audioId: audioId || null,
        imageId: imageId || null,
        snoozeMins: effectiveSnooze,
        enabled: normalizedEnabled,
        scheduleAt: firstScheduleAt,
        cronExpr: null,     // ya no se usa, pero se deja en null por compatibilidad
      },
      include: {
        audio: { select: { url: true } },
        image: { select: { url: true } },
      },
    });

    if (alarm.enabled) {
      await scheduleAlarm({
        id: alarm.id,
        name: alarm.name,
        enabled: alarm.enabled,
        scheduleAt: alarm.scheduleAt,
        snoozeMins: alarm.snoozeMins,
        audio: alarm.audio ? { url: alarm.audio.url } : null,
      });
    }

    await logHistory(req.userId!, "Alarm", "CREATE", alarm);
    res.status(201).json(alarm);
  } catch (error) {
    console.error("Error al crear alarma:", error);
    res.status(500).json({ message: "Error al crear alarma" });
  }
};

// Actualizar una alarma existente (Pomodoro-only)
export const updateAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, audioId, imageId, snoozeMins, enabled, scheduleAt } = req.body;

    const existing = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
      include: { audio: { select: { url: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Alarma no encontrada" });
    }

    if (typeof name !== "undefined" && !String(name).trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    let normalizedEnabled =
      typeof enabled === "boolean" ? enabled : existing.enabled;

    let nextSnooze =
      typeof snoozeMins === "number" && snoozeMins > 0
        ? snoozeMins
        : existing.snoozeMins || 25;

    let nextScheduleAt: Date | null | undefined = undefined;

    if (!normalizedEnabled) {
      // Si se deshabilita → se limpia scheduleAt
      nextScheduleAt = null;
    } else {
      // Seguimos habilitados
      if (typeof scheduleAt !== "undefined") {
        // Caso especial: botones de aplazo desde el popup
        nextScheduleAt = scheduleAt ? new Date(scheduleAt) : null;
      } else if (!existing.scheduleAt || existing.scheduleAt.getTime() <= Date.now()) {
        // Si no había programación futura, recalcular
        nextScheduleAt = new Date(Date.now() + nextSnooze * 60000);
      }
      // Si sí tiene scheduleAt futuro y no mandaron uno nuevo, se mantiene
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        name: typeof name !== "undefined" ? String(name).trim() : undefined,
        audioId: typeof audioId !== "undefined" ? (audioId || null) : undefined,
        imageId: typeof imageId !== "undefined" ? (imageId || null) : undefined,
        snoozeMins: typeof snoozeMins !== "undefined" ? nextSnooze : undefined,
        enabled: normalizedEnabled,
        scheduleAt:
          typeof nextScheduleAt !== "undefined" ? nextScheduleAt : undefined,
        cronExpr: null,
      },
      include: {
        audio: { select: { url: true } },
        image: { select: { url: true } },
      },
    });

    if (updated.enabled && updated.scheduleAt) {
      await scheduleAlarm({
        id: updated.id,
        name: updated.name,
        enabled: updated.enabled,
        scheduleAt: updated.scheduleAt,
        snoozeMins: updated.snoozeMins,
        audio: updated.audio ? { url: updated.audio.url } : null,
      });
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

    if (!existing) {
      return res.status(404).json({ message: "Alarma no encontrada" });
    }

    cancelAlarm(id);

    await prisma.alarm.delete({ where: { id } });
    await logHistory(req.userId!, "Alarm", "DELETE", existing);
    res.json({ message: "Alarma eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar alarma:", error);
    res.status(500).json({ message: "Error al eliminar alarma" });
  }
};

// Activar/desactivar rápidamente (toggle Pomodoro)
export const toggleAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const alarm = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
      include: { audio: { select: { url: true } } },
    });

    if (!alarm) {
      return res.status(404).json({ message: "Alarma no encontrada" });
    }

    const newEnabled = !alarm.enabled;

    let nextScheduleAt: Date | null = null;
    if (newEnabled) {
      const snooze = alarm.snoozeMins && alarm.snoozeMins > 0 ? alarm.snoozeMins : 25;
      nextScheduleAt = new Date(Date.now() + snooze * 60000);
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        enabled: newEnabled,
        scheduleAt: nextScheduleAt,
        cronExpr: null,
      },
      include: {
        audio: { select: { url: true } },
        image: { select: { url: true } },
      },
    });

    if (updated.enabled && updated.scheduleAt) {
      await scheduleAlarm({
        id: updated.id,
        name: updated.name,
        enabled: updated.enabled,
        scheduleAt: updated.scheduleAt,
        snoozeMins: updated.snoozeMins,
        audio: updated.audio ? { url: updated.audio.url } : null,
      });
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
