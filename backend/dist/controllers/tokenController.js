"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshAccessToken = void 0;
const tokenService_1 = require("../services/tokenService");
const historyService_1 = require("../services/historyService");
const token_1 = require("../utils/token");
// ✅ Refrescar Access Token
const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ message: "Refresh token es requerido." });
    try {
        const decoded = await (0, token_1.verifyToken)(refreshToken);
        if (!decoded || !decoded.userId) {
            return res.status(403).json({ message: "Refresh token inválido o expirado." });
        }
        const session = await (0, tokenService_1.refreshSession)(refreshToken);
        if (!session)
            return res.status(403).json({ message: "El refresh token ha expirado o no es valido." });
        await (0, historyService_1.logHistory)(decoded.userId, "AuthToken", "REFRESH_TOKEN", {
            tokenId: session.id || "N/A",
            createdAt: session.createdAt || new Date(),
            newAccessToken: true,
        });
        res.json({
            message: "Nuevo access token generado exitosamente.",
            ...session,
        });
    }
    catch (error) {
        console.error("[TOKEN] Error al refrescar token:", error);
        res.status(500).json({ message: "Error interno al generar nuevo token." });
    }
};
exports.refreshAccessToken = refreshAccessToken;
// Cerrar sesion
const logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ message: "Refresh token es requerido." });
    try {
        // 1️⃣ Verificamos token para obtener userId antes de revocarlo
        const decoded = (0, token_1.verifyToken)(refreshToken);
        // 2️⃣ Revocamos la sesión en la base de datos
        const revoked = await (0, tokenService_1.revokeSession)(refreshToken);
        if (!revoked) {
            return res.status(404).json({ message: "Sesión no encontrada o ya cerrada." });
        }
        // 3️⃣ Registramos el evento en el historial (solo si hay userId válido)
        if (decoded?.userId) {
            await (0, historyService_1.logHistory)(decoded.userId, "AuthToken", "LOGOUT", {
                tokenId: revoked.id,
                revokedAt: revoked.revokedAt || new Date(),
            });
        }
        res.status(200).json({ message: "Sesión cerrada exitosamente." });
    }
    catch (error) {
        console.error("[TOKEN] Error en logout:", error);
        res.status(500).json({ message: "Error interno al cerrar sesión." });
    }
};
exports.logout = logout;
