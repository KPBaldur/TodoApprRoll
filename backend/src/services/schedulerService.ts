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
    // Si tiene cronExpr (por ejemplo: "0 8 * * *" -> todos los días a las 8 AM)
    if (cronExpr) {
      cron.schedule(cronExpr, () => triggerAlarm(alarm));
      console.log(`🕒 Alarma '${name}' programada con cronExpr: ${cronExpr}`);
      return;
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
    console.log(`ACTIVANDO ALARMA: ${alarm.name}`);

    if (alarm.audio?.url) {
    await playAudio(alarm.audio.url);
  } else {
    console.log(`🔈 Alarma '${alarm.name}' sin audio asignado.`);
  }

  // Si tiene snooze activo, reprogramar
  if (alarm.snoozeMins && alarm.snoozeMins > 0) {
    const nextTrigger = new Date(Date.now() + alarm.snoozeMins * 60000);
    console.log(`🔁 Alarma '${alarm.name}' repetirá a las ${nextTrigger.toLocaleTimeString()}`);

    setTimeout(() => triggerAlarm(alarm), alarm.snoozeMins * 60000);
  }
};

cron.schedule("0 */48 * * *", async () => {
  console.log("Iniciando tarea programada de mantenimiento...");
  await runMaintenance();
});