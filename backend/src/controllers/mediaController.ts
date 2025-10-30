import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";

export const getMedia = async (req: AuthRequest, res: Response) => {
  try {
    const media = await prisma.media.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(media);
  } catch (error) {
    console.error("Error al obtener multimedia:", error);
    res.status(500).json({ message: "Error al obtener multimedia" });
  }
};

export const uploadMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, type, publicId } = req.body;
    if (!url || !publicId) 
        return res.status(400).json({ message: "URL y publicId requeridos" });
    const newMedia = await prisma.media.create({
        data: {
           userId: req.userId!,
           name,
           url,
           type,
           publicId,
        },
    });

    res.status(201).json(newMedia);
  } catch (error) {
    console.error("Error al subir multimedia:", error);
    res.status(500).json({ message: "Error al subir multimedia" });
  }
};

export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.media.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ message: "Archivo no encontrado" });

    await prisma.media.delete({ where: { id } });
    res.json({ message: "Archivo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar multimedia:", error);
    res.status(500).json({ message: "Error al eliminar multimedia" });
  }
};
