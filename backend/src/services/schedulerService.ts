// backend/src/services/schedulerService.ts
// Scheduler para Alarmas (Pomodoro y Datetime)

import cron from "node-cron";
import prisma from "./prismaService";
import { playAudio } from "../utils/audioPlayer";
import { runMaintenance } from "./maintenanceService";
import eventBus from "./eventBus";

interface ActiveAlarm {
  id: string;
  name: string;
  active: boolean;
  type: string;
  scheduleAt: Date | null;
  durationMin: number | null;
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
    } catch { }
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
    `📅 Programada para: ${when.toLocaleString()} | Alarma '${alarm.name}' (${alarm.type})`
  );
}

/**
 * Programa una alarma.
 */
export const scheduleAlarm = async (alarmInput: ActiveAlarm) => {
  const { id } = alarmInput;

  // Cancelar timeout previo
  cancelAlarm(id);

  try {
    // Leer estado fresco de BD
    const fresh = await prisma.alarm.findUnique({
      where: { id },
      include: { audio: { select: { url: true } } },
    });

    if (!fresh) {
      console.log(`⛔ Alarma ID '${id}' no existe, no se programa.`);
      return;
    }

    if (!fresh.active) {
      console.log(`⛔ Alarma '${fresh.name}' deshabilitada, no se programa.`);
      return;
    }

    let when = toDate(fresh.scheduleAt);
    const now = Date.now();

    // Lógica específica por tipo
    if (fresh.type === "pomodoro") {
      const duration = fresh.durationMin && fresh.durationMin > 0 ? fresh.durationMin : 25;

      // Si no hay scheduleAt o está en el pasado → recalcular
      if (!when || when.getTime() <= now) {
        when = new Date(now + duration * 60000);
        await prisma.alarm.update({
          where: { id: fresh.id },
          data: { scheduleAt: when },
        });
      }
    } else {
      // Datetime
      if (!when || when.getTime() <= now) {
        console.log(`⛔ Alarma Datetime '${fresh.name}' ya pasó o no tiene fecha.`);
        // Opcional: desactivarla
        if (fresh.active) {
          await prisma.alarm.update({
            where: { id: fresh.id },
            data: { active: false }
          });
        }
        return;
      }
    }

    if (when) {
      scheduleTimeout(
        {
          id: fresh.id,
          name: fresh.name,
          active: fresh.active,
          type: fresh.type,
          scheduleAt: when,
          durationMin: fresh.durationMin,
          audio: fresh.audio ? { url: fresh.audio.url } : null,
        },
        when
      );
    }

  } catch (error) {
    console.error(`❌ Error al programar alarma '${alarmInput.name}':`, error);
  }
};

/**
 * Dispara una alarma por ID, reproduce sonido y reprograma si es Pomodoro.
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

    if (!fresh.active) {
      console.log(`⛔ Alarma '${fresh.name}' está deshabilitada; no se ejecuta.`);
      cancelAlarm(alarmId);
      return;
    }

    console.log(`🔔 ACTIVANDO ALARMA: ${fresh.name} | UserID: ${fresh.userId}`);

    eventBus.emit("alarmTriggered", {
      id: fresh.id,
      name: fresh.name,
      audioUrl: fresh.audio?.url || null,
      userId: fresh.userId,
      timestamp: Date.now()
    });


    if (fresh.audio?.url) {
      await playAudio(fresh.audio.url);
    } else {
      console.log(`🔈 Alarma '${fresh.name}' sin audio asignado.`);
    }

    // Lógica post-disparo
    if (fresh.type === "pomodoro") {
      // Reprogramar siguiente ciclo Pomodoro
      const duration = fresh.durationMin && fresh.durationMin > 0 ? fresh.durationMin : 25;
      const next = new Date(Date.now() + duration * 60000);

      const updated = await prisma.alarm.update({
        where: { id: fresh.id },
        data: { scheduleAt: next },
        include: { audio: { select: { url: true } } },
      });

      console.log(
        `🔁 Pomodoro: '${fresh.name}' repetirá a las ${next.toLocaleTimeString()} (+${duration} min)`
      );

      // Reprogramar en memoria
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
      // Datetime: desactivar después de sonar
      console.log(`🏁 Alarma Datetime '${fresh.name}' finalizada. Desactivando.`);
      await prisma.alarm.update({
        where: { id: fresh.id },
        data: { active: false, scheduleAt: null }
      });
      cancelAlarm(fresh.id);
    }

  } catch (error) {
    console.error(`❌ Error al activar alarma '${alarmId}':`, error);
  }
};

/**
 * Carga todas las alarmas activas y las programa.
 */
export const initializeAlarms = async () => {
  console.log("⏳ Cargando alarmas activas…");

  const alarms = await prisma.alarm.findMany({
    where: { active: true },
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
      active: alarm.active,
      type: alarm.type,
      scheduleAt: alarm.scheduleAt,
      durationMin: alarm.durationMin,
      audio: alarm.audio ? { url: alarm.audio.url } : null,
    });
  }
};

// Tarea de mantenimiento cada 48 horas
cron.schedule("0 */48 * * *", async () => {
  console.log("Iniciando tarea programada de mantenimiento...");
  await runMaintenance();
});
