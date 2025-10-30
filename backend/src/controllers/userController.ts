import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import * as userService from "../services/userService";

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await userService.getUserById(req.userId!);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(user);
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
        res.status(500).json({ message: "Error al obtener el perfil de usuario" });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const updated = await userService.updateUser(req.userId!, req.body);
        res.json({ message: "Perfil actualizado", user: updated });        
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        res.status(500).json({ message: "Error al actualizar el perfil de usuario" });
    }
};