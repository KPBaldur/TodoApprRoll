// backend/src/services/schedulerService.ts
// Scheduler SOLO para Pomodoro (scheduleAt + snoozeMins)

import cron from "node-cron";
import prisma from "./prismaService";
import { playAudio } from "../utils/audioPlayer";
import { runMaintenance } from "./maintenanceService";

interface ActiveAlarm {
  id: string;
  name: string;
  enabled: boolean;
  scheduleAt: Date | null;
  snoozeMins: number | null;
  audio?: { url?: string | null } | null;
}

// Registro en memoria de timeouts
const timeouts = new Map<string, NodeJS.Timeout>();

/**
 * Normaliza un valor a Date válido o null.
 */
function toDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Cancela cualquier timeout asociado a una alarma.
 */
export const cancelAlarm = (alarmId: string) => {
  const to = timeouts.get(alarmId);
  if (to) {
    try {
      clearTimeout(to);
    } catch {}
    timeouts.delete(alarmId);
  }
  console.log(`🚫 Cancelada alarma ID '${alarmId}'`);
};

/**
 * Programa un timeout y lo registra.
 */
function scheduleTimeout(alarm: ActiveAlarm, when: Date) {
  const diff = when.getTime() - Date.now();
  if (diff <= 0) {
    console.log(
      `⏭️ Alarma '${alarm.name}' tenía fecha pasada (${when.toISOString()}), no se programa.`
    );
    return;
  }

  const to = setTimeout(() => {
    // Disparo real de alarma
    triggerAlarm(alarm.id).catch((err) =>
      console.error(`❌ Error en triggerAlarm('${alarm.id}')`, err)
    );
  }, diff);

  timeouts.set(alarm.id, to);
  console.log(
    `📅 Programada para: ${when.toLocaleString()} | Alarma '${alarm.name}'`
  );
}

/**
 * Programa una alarma Pomodoro.
 * Regla: si está habilitada y no tiene scheduleAt futuro,
 * se recalcula: now + snoozeMins.
 */
export const scheduleAlarm = async (alarmInput: ActiveAlarm) => {
  const { id } = alarmInput;

  // Cancelar timeout previo
  cancelAlarm(id);

  try {
    // Leer estado fresco de BD (evita errores de datos viejos)
    const fresh = await prisma.alarm.findUnique({
      where: { id },
      include: { audio: { select: { url: true } } },
    });

    if (!fresh) {
      console.log(`⛔ Alarma ID '${id}' no existe, no se programa.`);
      return;
    }

    if (!fresh.enabled) {
      console.log(`⛔ Alarma '${fresh.name}' deshabilitada, no se programa.`);
      return;
    }

    const snooze = fresh.snoozeMins && fresh.snoozeMins > 0 ? fresh.snoozeMins : 5;

    let when = toDate(fresh.scheduleAt);
    const now = Date.now();

    // Si no hay scheduleAt o está en el pasado → recalcular
    if (!when || when.getTime() <= now) {
      when = new Date(now + snooze * 60000);
      await prisma.alarm.update({
        where: { id: fresh.id },
        data: { scheduleAt: when },
      });
    }

    scheduleTimeout(
      {
        id: fresh.id,
        name: fresh.name,
        enabled: fresh.enabled,
        scheduleAt: when,
        snoozeMins: fresh.snoozeMins,
        audio: fresh.audio ? { url: fresh.audio.url } : null,
      },
      when
    );
  } catch (error) {
    console.error(`❌ Error al programar alarma '${alarmInput.name}':`, error);
  }
};

/**
 * Dispara una alarma por ID, reproduce sonido y reprograma Pomodoro.
 */
const triggerAlarm = async (alarmId: string) => {
  try {
    const fresh = await prisma.alarm.findUnique({
      where: { id: alarmId },
      include: { audio: { select: { url: true } } },
    });

    if (!fresh) {
      console.log(`⛔ Alarma ID '${alarmId}' no encontrada; cancelando.`);
      cancelAlarm(alarmId);
      return;
    }

    if (!fresh.enabled) {
      console.log(`⛔ Alarma '${fresh.name}' está deshabilitada; no se ejecuta.`);
      cancelAlarm(alarmId);
      return;
    }

    console.log(`🔔 ACTIVANDO ALARMA: ${fresh.name}`);

    if (fresh.audio?.url) {
      await playAudio(fresh.audio.url);
    } else {
      console.log(`🔈 Alarma '${fresh.name}' sin audio asignado.`);
    }

    // Reprogramar siguiente ciclo Pomodoro
    const snooze = fresh.snoozeMins && fresh.snoozeMins > 0 ? fresh.snoozeMins : 5;
    const next = new Date(Date.now() + snooze * 60000);

    const updated = await prisma.alarm.update({
      where: { id: fresh.id },
      data: { scheduleAt: next },
      include: { audio: { select: { url: true } } },
    });

    console.log(
      `🔁 Pomodoro: '${fresh.name}' repetirá a las ${next.toLocaleTimeString()} (+${snooze} min)`
    );

    // Reprogramar en memoria
    await scheduleAlarm({
      id: updated.id,
      name: updated.name,
      enabled: updated.enabled,
      scheduleAt: updated.scheduleAt,
      snoozeMins: updated.snoozeMins,
      audio: updated.audio ? { url: updated.audio.url } : null,
    });
  } catch (error) {
    console.error(`❌ Error al activar alarma '${alarmId}':`, error);
  }
};

/**
 * Carga todas las alarmas habilitadas y las programa como Pomodoro.
 */
export const initializeAlarms = async () => {
  console.log("⏳ Cargando alarmas activas (Pomodoro)…");

  const alarms = await prisma.alarm.findMany({
    where: { enabled: true },
    include: { audio: { select: { url: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!alarms.length) {
    console.log("⚠️ No hay alarmas activas para programar.");
    return;
  }

  console.log(`✅ ${alarms.length} alarmas activas encontradas.`);
  for (const alarm of alarms) {
    await scheduleAlarm({
      id: alarm.id,
      name: alarm.name,
      enabled: alarm.enabled,
      scheduleAt: alarm.scheduleAt,
      snoozeMins: alarm.snoozeMins,
      audio: alarm.audio ? { url: alarm.audio.url } : null,
    });
  }
};

// Tarea de mantenimiento cada 48 horas (se mantiene igual)
cron.schedule("0 */48 * * *", async () => {
  console.log("Iniciando tarea programada de mantenimiento...");
  await runMaintenance();
});
