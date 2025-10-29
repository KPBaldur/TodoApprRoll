import { Request, Response } from "express";
import { refreshSession, revokeSession } from "../services/token.service";
import { logHistory } from "@services/historyService";
import { verifyToken } from "../utils/token";

// ✅ Refrescar Access Token
export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token es requerido." });

  try {
    const decoded = await verifyToken(refreshToken);

    if (!decoded || !decoded.userId) {
        return res.status(403).json({ message: "Refresh token inválido o expirado." });
    }
      
    const session = await refreshSession(refreshToken);

    if (!session)
        return res.status(403).json({ message: "El refresh token ha expirado o no es valido." });

    await logHistory(
        decoded.userId,
        "AuthToken",
        "REFRESH_TOKEN",
        {
            tokenId: session.id || "N/A",
            createdAt: session.createdAt || new Date(),
            newAccessToken: true,
        }
    );

    res.json({
        message: "Nuevo access token generado exitosamente.",
        ...session,
    });
  } catch (error) {
    console.error("[TOKEN] Error al refrescar token:", error);
    res.status(500).json({ message: "Error interno al generar nuevo token." });
  }
};

// Cerrar sesion
export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token es requerido." });

  try {
    // 1️⃣ Verificamos token para obtener userId antes de revocarlo
    const decoded = verifyToken(refreshToken);

    // 2️⃣ Revocamos la sesión en la base de datos
    const revoked = await revokeSession(refreshToken);

    if (!revoked) {
      return res.status(404).json({ message: "Sesión no encontrada o ya cerrada." });
    }

    // 3️⃣ Registramos el evento en el historial (solo si hay userId válido)
    if (decoded?.userId) {
      await logHistory(
        decoded.userId,
        "AuthToken",
        "LOGOUT",
        {
          tokenId: revoked.id,
          revokedAt: revoked.revokedAt || new Date(),
        }
      );
    }

    res.status(200).json({ message: "Sesión cerrada exitosamente." });
  } catch (error) {
    console.error("[TOKEN] Error en logout:", error);
    res.status(500).json({ message: "Error interno al cerrar sesión." });
  }
};