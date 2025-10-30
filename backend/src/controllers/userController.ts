import prisma from "../services/prismaService";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import * as userService from "../services/userService";
import { logHistory } from "@services/historyService";

// Obtener perfil de usuario autenticado
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, username: true, createdAt: true},
        });

        if  (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json(user);
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
        res.status(500).json({ message: "Error al obtener el perfil de usuario" });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!existing)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const update = await prisma.user.update({
      where: { id: req.userId },
      data: { username, passHash: password || existing.passHash },
    });

    await logHistory(
      req.userId!,
      "User",
      "UPDATE_PROFILE",
      { username, passwordChanged: !!password }
    );

    res.json({ message: "Perfil actualizado correctamente", update });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    await prisma.user.delete({ where: { id: req.userId } });
    await logHistory(req.userId!, "User", "DELETE", { username: user.username });

    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    res.status(500).json({ message: "Error al eliminar cuenta" });
  }
};