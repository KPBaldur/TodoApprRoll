import { Request, Response } from "express";
import { refreshSession, revokeSession } from "../services/token.service";

export const refreshAccessToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ message: "Refresh token es requerido." });

    const session = await refreshSession(refreshToken);
    if (!session)
        return res.status(403).json({ message: "Refresh token inválido." });

    res.json({message: "Nuevo access token generado", ...session});
};

export const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeSession(refreshToken);
    res.status(200).json({ message: "Sesión cerrada exitosamente." });
}
