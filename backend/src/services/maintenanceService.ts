// src/services/maintenanceService.ts
import prisma from "../services/prismaService";
import { logHistory } from "./historyService";

/**
 * Limpia todos los refresh tokens expirados de la base de datos.
 */
export const cleanExpiredTokens = async () => {
  try {
    const now = new Date();
    const deleted = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    if (deleted.count > 0) {
      await logHistory(
        "system",
        "Maintenance",
        "CLEAN_EXPIRED_TOKENS",
        { deleted: deleted.count, timestamp: now }
      );
    }

    console.log(`🧹 Tokens expirados eliminados: ${deleted.count}`);
  } catch (error) {
    console.error("[Maintenance] Error al limpiar tokens:", error);
  }
};

/**
 * Limpia registros del historial con más de 30 días.
 */
export const cleanOldHistory = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const deleted = await prisma.history.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    if (deleted.count > 0) {
      await logHistory(
        "system",
        "Maintenance",
        "CLEAN_OLD_HISTORY",
        { deleted: deleted.count, cutoff }
      );
    }

    console.log(`🧾 Historial antiguo eliminado: ${deleted.count}`);
  } catch (error) {
    console.error("[Maintenance] Error al limpiar historial:", error);
  }
};

/**
 * Ejecuta todas las rutinas de mantenimiento del sistema.
 */
export const runMaintenance = async () => {
  console.log("🔧 Ejecutando mantenimiento automático...");
  await cleanExpiredTokens();
  await cleanOldHistory();
  console.log("✅ Mantenimiento finalizado correctamente.");
};
