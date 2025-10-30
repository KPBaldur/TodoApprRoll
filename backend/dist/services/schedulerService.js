"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAlarm = exports.initializeAlarms = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prismaService_1 = __importDefault(require("./prismaService"));
const audioPlayer_1 = require("../utils/audioPlayer");
const maintenanceService_1 = require("./maintenanceService");
// Carga y programa todas las alarmas activas desde la base de datos
const initializeAlarms = async () => {
    console.log("⏳ Cargando alarmas activas...");
    const alarms = await prismaService_1.default.alarm.findMany({
        where: { enabled: true },
        include: { audio: { select: { url: true } } },
    });
    if (alarms.length === 0) {
        console.log("⚠️ No hay alarmas activas para programar.");
        return;
    }
    console.log(`✅ ${alarms.length} alarmas activas encontradas.`);
    alarms.forEach((alarm) => (0, exports.scheduleAlarm)(alarm));
};
exports.initializeAlarms = initializeAlarms;
// Programa una alarma individual basada en su configuracion
const scheduleAlarm = (alarm) => {
    const { id, name, cronExpr, scheduleAt, snoozeMins, audio } = alarm;
    try {
        // Si tiene cronExpr (por ejemplo: "0 8 * * *" -> todos los días a las 8 AM)
        if (cronExpr) {
            node_cron_1.default.schedule(cronExpr, () => triggerAlarm(alarm));
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
            }
            else {
                console.log(`⏭️ Alarma '${name}' tiene una fecha pasada, ignorada.`);
            }
        }
    }
    catch (error) {
        console.error(`❌ Error al programar alarma '${name}':`, error);
    }
};
exports.scheduleAlarm = scheduleAlarm;
//Ejecuta la accion de una alarma cuando se activa
const triggerAlarm = async (alarm) => {
    console.log(`ACTIVANDO ALARMA: ${alarm.name}`);
    if (alarm.audio?.url) {
        await (0, audioPlayer_1.playAudio)(alarm.audio.url);
    }
    else {
        console.log(`🔈 Alarma '${alarm.name}' sin audio asignado.`);
    }
    // Si tiene snooze activo, reprogramar
    if (alarm.snoozeMins && alarm.snoozeMins > 0) {
        const nextTrigger = new Date(Date.now() + alarm.snoozeMins * 60000);
        console.log(`🔁 Alarma '${alarm.name}' repetirá a las ${nextTrigger.toLocaleTimeString()}`);
        setTimeout(() => triggerAlarm(alarm), alarm.snoozeMins * 60000);
    }
};
node_cron_1.default.schedule("0 */48 * * *", async () => {
    console.log("Iniciando tarea programada de mantenimiento...");
    await (0, maintenanceService_1.runMaintenance)();
});
