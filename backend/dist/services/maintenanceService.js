"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMaintenance = exports.cleanOldHistory = exports.cleanExpiredTokens = void 0;
// src/services/maintenanceService.ts
const prismaService_1 = __importDefault(require("../services/prismaService"));
const historyService_1 = require("./historyService");
/**
 * Limpia todos los refresh tokens expirados de la base de datos.
 */
const cleanExpiredTokens = async () => {
    try {
        const now = new Date();
        const deleted = await prismaService_1.default.refreshToken.deleteMany({
            where: { expiresAt: { lt: now } },
        });
        if (deleted.count > 0) {
            await (0, historyService_1.logHistory)("system", "Maintenance", "CLEAN_EXPIRED_TOKENS", { deleted: deleted.count, timestamp: now });
        }
        console.log(`🧹 Tokens expirados eliminados: ${deleted.count}`);
    }
    catch (error) {
        console.error("[Maintenance] Error al limpiar tokens:", error);
    }
};
exports.cleanExpiredTokens = cleanExpiredTokens;
/**
 * Limpia registros del historial con más de 30 días.
 */
const cleanOldHistory = async () => {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const deleted = await prismaService_1.default.history.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });
        if (deleted.count > 0) {
            await (0, historyService_1.logHistory)("system", "Maintenance", "CLEAN_OLD_HISTORY", { deleted: deleted.count, cutoff });
        }
        console.log(`🧾 Historial antiguo eliminado: ${deleted.count}`);
    }
    catch (error) {
        console.error("[Maintenance] Error al limpiar historial:", error);
    }
};
exports.cleanOldHistory = cleanOldHistory;
/**
 * Ejecuta todas las rutinas de mantenimiento del sistema.
 */
const runMaintenance = async () => {
    console.log("🔧 Ejecutando mantenimiento automático...");
    await (0, exports.cleanExpiredTokens)();
    await (0, exports.cleanOldHistory)();
    console.log("✅ Mantenimiento finalizado correctamente.");
};
exports.runMaintenance = runMaintenance;
