import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import { logHistory } from "../services/historyService";
import { scheduleAlarm, cancelAlarm, validateCron } from "../services/schedulerService";

// -------------------------------------------------------
// GET: Todas las alarmas
// -------------------------------------------------------
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
    console.error("❌ Error al obtener alarmas:", error);
    res.status(500).json({ message: "Error al obtener alarmas" });
  }
};

// -------------------------------------------------------
// POST: Crear alarma
// -------------------------------------------------------
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
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    // ⚠️ Validación central: Pomodoro válido, Date válido o Cron válido
    const isPomodoro = snoozeMins && scheduleAt && !cronExpr;
    const isDateAlarm = scheduleAt && !cronExpr;
    const isCronAlarm = !scheduleAt && cronExpr;

    if (!isPomodoro && !isDateAlarm && !isCronAlarm) {
      return res.status(400).json({
        message:
          "Configuración inválida: debe usar Date (scheduleAt), Cron (cronExpr) o Pomodoro (scheduleAt + snoozeMins)",
      });
    }

    if (cronExpr && !validateCron(cronExpr)) {
      return res.status(400).json({ message: "Expresión cron inválida" });
    }

    const alarm = await prisma.alarm.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        audioId: audioId || null,
        imageId: imageId || null,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
        snoozeMins: snoozeMins ?? null,
        cronExpr: cronExpr || null,
        enabled: enabled ?? true,
      },
      include: { audio: { select: { url: true } } },
    });

    if (alarm.enabled) scheduleAlarm(alarm);
    await logHistory(req.userId!, "Alarm", "CREATE", alarm);

    res.status(201).json(alarm);
  } catch (error) {
    console.error("❌ Error al crear alarma:", error);
    res.status(500).json({ message: "Error al crear alarma" });
  }
};

// -------------------------------------------------------
// PUT: Actualizar alarma
// -------------------------------------------------------
export const updateAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
      include: { audio: { select: { url: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Alarma no encontrada" });
    }

    const {
      name,
      audioId,
      imageId,
      scheduleAt,
      snoozeMins,
      cronExpr,
      enabled,
    } = req.body;

    // Validaciones
    const isPomodoro = snoozeMins && scheduleAt && !cronExpr;
    const isDateAlarm = scheduleAt && !cronExpr;
    const isCronAlarm = !scheduleAt && cronExpr;

    if (!isPomodoro && !isDateAlarm && !isCronAlarm) {
      return res.status(400).json({
        message:
          "Configuración inválida: debe usar Date (scheduleAt), Cron (cronExpr) o Pomodoro (scheduleAt + snoozeMins)",
      });
    }

    if (cronExpr && !validateCron(cronExpr)) {
      return res.status(400).json({ message: "Expresión cron inválida" });
    }

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        audioId: audioId ?? existing.audioId,
        imageId: imageId ?? existing.imageId,
        scheduleAt: typeof scheduleAt !== "undefined" ? (scheduleAt ? new Date(scheduleAt) : null) : existing.scheduleAt,
        snoozeMins: typeof snoozeMins !== "undefined" ? snoozeMins : existing.snoozeMins,
        cronExpr: typeof cronExpr !== "undefined" ? (cronExpr || null) : existing.cronExpr,
        enabled: typeof enabled !== "undefined" ? enabled : existing.enabled,
      },
      include: { audio: { select: { url: true } } },
    });

    // Reprogramamos inmediatamente
    if (updated.enabled) {
      scheduleAlarm(updated);
    } else {
      cancelAlarm(updated.id);
    }

    await logHistory(req.userId!, "Alarm", "UPDATE", updated);
    res.json(updated);
  } catch (error) {
    console.error("❌ Error al actualizar alarma:", error);
    res.status(500).json({ message: "Error al actualizar alarma" });
  }
};

// -------------------------------------------------------
// DELETE: Eliminar alarma
// -------------------------------------------------------
export const deleteAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing)
      return res.status(404).json({ message: "Alarma no encontrada" });

    cancelAlarm(id);

    await prisma.alarm.delete({ where: { id } });
    await logHistory(req.userId!, "Alarm", "DELETE", existing);

    res.json({ message: "Alarma eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar alarma:", error);
    res.status(500).json({ message: "Error al eliminar alarma" });
  }
};

// -------------------------------------------------------
// PATCH: Activar/Desactivar (toggle)
// -------------------------------------------------------
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

    if (updated.enabled) scheduleAlarm(updated);
    else cancelAlarm(updated.id);

    await logHistory(req.userId!, "Alarm", "TOGGLE", updated);
    res.json(updated);
  } catch (error) {
    console.error("❌ Error al activar/desactivar alarma:", error);
    res.status(500).json({ message: "Error al modificar alarma" });
  }
};

// -------------------------------------------------------
// PATCH: Aplazar Pomodoro / Snooze manual
// -------------------------------------------------------
export const snoozeAlarm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body; // 5, 10, 15, "next"

    const alarm = await prisma.alarm.findFirst({
      where: { id, userId: req.userId },
    });

    if (!alarm) return res.status(404).json({ message: "Alarma no encontrada" });

    const snoozeMinutes =
      minutes === "next"
        ? alarm.snoozeMins
        : Number(minutes);

    if (!snoozeMinutes)
      return res.status(400).json({ message: "Valor de aplazo inválido" });

    const next = new Date(Date.now() + snoozeMinutes * 60000);

    const updated = await prisma.alarm.update({
      where: { id },
      data: {
        scheduleAt: next,
        cronExpr: null,
      },
    });

    scheduleAlarm(updated);

    await logHistory(req.userId!, "Alarm", "SNOOZE", {
      minutes: snoozeMinutes,
      newScheduleAt: next,
    });

    res.json(updated);
  } catch (error) {
    console.error("❌ Error al aplazar alarma:", error);
    res.status(500).json({ message: "Error al aplazar alarma" });
  }
};