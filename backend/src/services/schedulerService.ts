// Reescritura completa del scheduler
import cron, { ScheduledTask } from "node-cron";
import prisma from "./prismaService";
import { playAudio } from "../utils/audioPlayer";
import { runMaintenance } from "./maintenanceService";

interface ActiveAlarm {
  id: string;
  name: string;
  enabled?: boolean;
  cronExpr?: string | null;
  scheduleAt?: Date | null;
  snoozeMins?: number | null;
  audio?: { url?: string | null } | null;
}

// Registro en memoria de tareas para poder cancelarlas/reprogramarlas
const cronTasks = new Map<string, ScheduledTask>();
const timeouts = new Map<string, NodeJS.Timeout>();

export function validateCron(expr?: string | null): boolean {
  const s = (expr || "").trim();
  return !!s && cron.validate(s);
}

export function convertScheduleAt(input?: string | Date | null): Date | null {
  if (!input) return null;
  const dt = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

// Carga y programa todas las alarmas activas desde la base de datos
export const initializeAlarms = async () => {
  console.log("⏳ Cargando alarmas activas...");

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
  alarms.forEach((alarm) => scheduleAlarm(alarm as ActiveAlarm));
};

// Cancela cualquier programación previa (cron y timeout)
export const cancelAlarm = (alarmId: string) => {
  const t = cronTasks.get(alarmId);
  if (t) {
    try {
      t.stop();
      // destroy existe en node-cron >=3; si no, el stop es suficiente
      // @ts-ignore
      if (typeof t.destroy === "function") t.destroy();
    } catch {}
    cronTasks.delete(alarmId);
  }

  const to = timeouts.get(alarmId);
  if (to) {
    try {
      clearTimeout(to);
    } catch {}
    timeouts.delete(alarmId);
  }

  console.log(`🚫 Cancelada alarma ID '${alarmId}'`);
};

// Helper para programar con setTimeout y registrar ID
function scheduleTimeout(alarm: ActiveAlarm, when: Date) {
  const diff = when.getTime() - Date.now();
  if (diff <= 0) {
    console.log(`⏭️ Alarma '${alarm.name}' programada en pasado, ignorada.`);
    return;
  }
  const to = setTimeout(() => triggerAlarm(alarm), diff);
  timeouts.set(alarm.id, to);
  console.log(`📅 Programada para: ${when.toLocaleString()} | Alarma '${alarm.name}'`);
}

// Programa una alarma individual basada en su configuración
export const scheduleAlarm = (alarm: ActiveAlarm) => {
  const { id, name, cronExpr, scheduleAt, snoozeMins } = alarm;

  // Cancelar programación previa antes de reprogramar
  cancelAlarm(id);

  try {
    // Caso: si hay temporizador efectivo o scheduleAt explícito → setTimeout
    const dt = convertScheduleAt(scheduleAt ?? null);
    if (dt) {
      scheduleTimeout(alarm, dt);
      return;
    }

    // Caso: CRON
    const expr = (cronExpr || "").trim();

    // Si tiene snooze, ignoramos cron y pasamos a scheduleAt cada snooze (Pomodoro)
    if (expr && snoozeMins && snoozeMins > 0) {
      const next = new Date(Date.now() + snoozeMins * 60000);
      console.log(
        `🕒 Alarma '${name}' con snooze activo: ignorando cron y usando temporizador cada ${snoozeMins} min`
      );
      scheduleTimeout(alarm, next);
      return;
    }

    // Programar cron si es válido
    if (validateCron(expr)) {
      const task = cron.schedule(expr, () => triggerAlarm(alarm));
      cronTasks.set(id, task);
      console.log(`🕒 Programada cron: '${expr}' | Alarma '${name}'`);
      return;
    }

    // Si no hay nada válido
    console.warn(`❌ Configuración inválida en '${name}': ni scheduleAt ni cronExpr válido`);
  } catch (error) {
    console.error(`❌ Error al programar alarma '${name}':`, error);
  }
};

// Ejecuta la acción de una alarma cuando se activa
const triggerAlarm = async (alarm: ActiveAlarm) => {
  try {
    // Leer estado real de DB para evitar disparar alarmas desactivadas o cambiadas
    const fresh = await prisma.alarm.findUnique({
      where: { id: alarm.id },
      include: { audio: { select: { url: true } } },
    });

    if (!fresh) {
      console.log(`⛔ Alarma '${alarm.name}' no encontrada; cancelando`);
      cancelAlarm(alarm.id);
      return;
    }

    if (!fresh.enabled) {
      console.log(`⛔ Alarma '${fresh.name}' desactivada; no se ejecuta.`);
      cancelAlarm(alarm.id);
      return;
    }

    console.log(`🔔 ACTIVANDO ALARMA: ${fresh.name}`);

    if (fresh.audio?.url) {
      await playAudio(fresh.audio.url);
    } else {
      console.log(`🔈 Alarma '${fresh.name}' sin audio asignado.`);
    }

    // Manejo de snooze: programar siguiente disparo por scheduleAt (ignora cron)
    if (fresh.snoozeMins && fresh.snoozeMins > 0) {
      const nextTrigger = new Date(Date.now() + fresh.snoozeMins * 60000);
      console.log(
        `🔁 Snooze: '${fresh.name}' repetirá a las ${nextTrigger.toLocaleTimeString()} (+${fresh.snoozeMins} min)`
      );
      scheduleTimeout(fresh as ActiveAlarm, nextTrigger);
    }
  } catch (error) {
    console.error(`❌ Error al activar alarma '${alarm.name}':`, error);
  }
};

// Tarea de mantenimiento cada 48 horas
cron.schedule("0 */48 * * *", async () => {
  console.log("Iniciando tarea programada de mantenimiento...");
  await runMaintenance();
});