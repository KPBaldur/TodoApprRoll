import cron from "node-cron";
import prisma from "./prismaService";
import { playAudio } from "../utils/audioPlayer";
import { runMaintenance } from "./maintenanceService";
interface ActiveAlarm {
    id: string;
    name: string;
    cronExpr?: string | null;
    scheduleAt?: Date | null;
    snoozeMins?: number | null;
    audio?: { url?: string | null} | null;
}

// Carga y programa todas las alarmas activas desde la base de datos
export const initializeAlarms = async () => {
  console.log("⏳ Cargando alarmas activas...");

  const alarms = await prisma.alarm.findMany({
    where: { enabled: true },
    include: { audio: { select: { url: true } } },
  });

  if (alarms.length === 0) {
    console.log("⚠️ No hay alarmas activas para programar.");
    return;
  }

  console.log(`✅ ${alarms.length} alarmas activas encontradas.`);

  alarms.forEach((alarm) => scheduleAlarm(alarm as ActiveAlarm));
};

// Programa una alarma individual basada en su configuracion
export const scheduleAlarm = (alarm: ActiveAlarm) => {
  const { id, name, cronExpr, scheduleAt, snoozeMins, audio } = alarm;

  try {
    // Normalizar CRON
    const normalizedCron = (cronExpr || "").trim();

    // Validar CRON antes de programar
    if (normalizedCron) {
      if (cron.validate(normalizedCron)) {
        cron.schedule(normalizedCron, () => triggerAlarm(alarm));
        console.log(`🕒 Alarma '${name}' programada con cronExpr: ${normalizedCron}`);
        return;
      } else {
        console.warn(`❌ Expresión cron inválida para '${name}': ${normalizedCron}`);
        return;
      }
    }

    // Si tiene una fecha específica programada
    if (scheduleAt) {
      const now = new Date();
      const timeDiff = scheduleAt.getTime() - now.getTime();

      if (timeDiff > 0) {
        setTimeout(() => triggerAlarm(alarm), timeDiff);
        console.log(`📅 Alarma '${name}' programada para ${scheduleAt.toLocaleString()}`);
      } else {
        console.log(`⏭️ Alarma '${name}' tiene una fecha pasada, ignorada.`);
      }
    }
  } catch (error) {
    console.error(`❌ Error al programar alarma '${name}':`, error);
  }
};

//Ejecuta la accion de una alarma cuando se activa
const triggerAlarm = async (alarm: ActiveAlarm) => {
  try {
    // Releer estado real desde DB (evita disparo de desactivadas)
    const fresh = await prisma.alarm.findUnique({
      where: { id: alarm.id },
      include: { audio: { select: { url: true } } },
    });

    if (!fresh || !fresh.enabled) {
      console.log(`⛔ Alarma '${alarm.name}' desactivada; no se ejecuta.`);
      return;
    }

    console.log(`ACTIVANDO ALARMA: ${fresh.name}`);

    if (fresh.audio?.url) {
      await playAudio(fresh.audio.url);
    } else {
      console.log(`🔈 Alarma '${fresh.name}' sin audio asignado.`);
    }

    if (fresh.snoozeMins && fresh.snoozeMins > 0) {
      const nextTrigger = new Date(Date.now() + fresh.snoozeMins * 60000);
      console.log(`🔁 Alarma '${fresh.name}' repetirá a las ${nextTrigger.toLocaleTimeString()}`);
      setTimeout(() => triggerAlarm(fresh as ActiveAlarm), fresh.snoozeMins * 60000);
    }
  } catch (error) {
    console.error(`❌ Error al activar alarma '${alarm.name}':`, error);
  }
};

cron.schedule("0 */48 * * *", async () => {
  console.log("Iniciando tarea programada de mantenimiento...");
  await runMaintenance();
});