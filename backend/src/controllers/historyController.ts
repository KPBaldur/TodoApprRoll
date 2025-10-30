import { Request, Response } from "express";
import prisma from "../services/prismaService";

export const getUserHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const history = await prisma.history.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        res.json({ success: true, history });
    } catch (error) {
        console.error("[HISTORY] Error al obtener historial:", error);
        res.status(500).json({ success: false, message: "Error al obtener historial" });
    }
};