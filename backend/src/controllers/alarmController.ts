// backend/src/controllers/alarmController.ts
// Controlador de alarmas

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

// Crear una nueva alarma
export const createAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, durationMin, scheduleAt, audioId, imageId, active } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (!type || !["pomodoro", "datetime"].includes(type)) {
      return res.status(400).json({ message: "Tipo de alarma inválido (pomodoro | datetime)" });
    }

    const normalizedActive = typeof active === "boolean" ? active : true;

    // Calcular scheduleAt inicial si es pomodoro y está activa
    let finalScheduleAt: Date | null = null;

    if (type === "datetime") {
      if (!scheduleAt) return res.status(400).json({ message: "Fecha requerida para alarma datetime" });
      finalScheduleAt = new Date(scheduleAt);
    } else if (type === "pomodoro" && normalizedActive) {
      const duration = typeof durationMin === "number" && durationMin > 0 ? durationMin : 25;
      finalScheduleAt = new Date(Date.now() + duration * 60000);
    }

    const alarm = await prisma.alarm.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        type,
        durationMin: type === "pomodoro" ? (durationMin || 25) : null,
        scheduleAt: finalScheduleAt,
        active: normalizedActive,
        audioId: audioId || null,
        imageId: imageId || null,
      },
      include: {
        audio: { select: { url: true } },
        image: { select: { url: true } },
      },
    });

    if (alarm.active && alarm.scheduleAt) {
      await scheduleAlarm({
        id: alarm.id,
        name: alarm.name,
        active: alarm.active,
        type: alarm.type,
        scheduleAt: alarm.scheduleAt,
        durationMin: alarm.durationMin,
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

// Actualizar una alarma existente
export const updateAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, durationMin, scheduleAt, audioId, imageId, active } = req.body;

    const existing = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
      include: { audio: { select: { url: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Alarma no encontrada" });
    }

    const nextActive = typeof active === "boolean" ? active : existing.active;
    const nextType = type || existing.type;

    let nextScheduleAt: Date | null | undefined = undefined;

    if (!nextActive) {
      nextScheduleAt = null;
    } else {
      // Si se activa o cambia parámetros de tiempo
      if (nextType === "datetime") {
        if (scheduleAt) nextScheduleAt = new Date(scheduleAt);
        else if (existing.type === "datetime") nextScheduleAt = existing.scheduleAt;
      } else {
        // Pomodoro
        // Si se pasa un nuevo duration o se reactiva, recalculamos desde ahora
        // O si se pasa explícitamente scheduleAt (ej: snooze)
        if (scheduleAt) {
          nextScheduleAt = new Date(scheduleAt);
        } else if (active === true || durationMin) {
          // Reactivando o cambiando duración -> reset timer
          const duration = durationMin || existing.durationMin || 25;
          nextScheduleAt = new Date(Date.now() + duration * 60000);
        }
      }
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        type: nextType,
        durationMin: typeof durationMin !== "undefined" ? durationMin : undefined,
        scheduleAt: nextScheduleAt,
        active: nextActive,
        audioId: typeof audioId !== "undefined" ? (audioId || null) : undefined,
        imageId: typeof imageId !== "undefined" ? (imageId || null) : undefined,
      },
      include: {
        audio: { select: { url: true } },
        image: { select: { url: true } },
      },
    });

    // Re-programar
    if (updated.active && updated.scheduleAt) {
      await scheduleAlarm({
        id: updated.id,
        name: updated.name,
        active: updated.active,
        type: updated.type,
        scheduleAt: updated.scheduleAt,
        durationMin: updated.durationMin,
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

// Activar/desactivar rápidamente (toggle)
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

    const newActive = !alarm.active;
    let nextScheduleAt: Date | null = null;

    if (newActive) {
      if (alarm.type === "pomodoro") {
        const duration = alarm.durationMin || 25;
        nextScheduleAt = new Date(Date.now() + duration * 60000);
      } else {
        // Datetime: si ya pasó, no se puede activar sin nueva fecha.
        // Si es futuro, se mantiene.
        if (alarm.scheduleAt && alarm.scheduleAt.getTime() > Date.now()) {
          nextScheduleAt = alarm.scheduleAt;
        } else {
          // No se puede activar una alarma de fecha pasada sin actualizar fecha
          // Opcional: lanzar error o dejarla activa pero sin schedule
          // Decisión: dejarla activa pero null schedule (no sonará)
          nextScheduleAt = null;
        }
      }
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        active: newActive,
        scheduleAt: nextScheduleAt,
      },
      include: {
        audio: { select: { url: true } },
        image: { select: { url: true } },
      },
    });

    if (updated.active && updated.scheduleAt) {
      await scheduleAlarm({
        id: updated.id,
        name: updated.name,
        active: updated.active,
        type: updated.type,
        scheduleAt: updated.scheduleAt,
        durationMin: updated.durationMin,
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
