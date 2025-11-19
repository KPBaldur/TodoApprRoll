import { Request, Response } from "express";
import prisma from "../services/prismaService";
import { AuthRequest } from "../middleware/authMiddleware";
import fs from "fs/promises";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/mediaService";

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
    const file = (req as any).file as Express.Multer.File | undefined;
    const { type } = req.body;

    if (!file) {
      return res.status(400).json({ message: "Archivo (file) requerido" });
    }

    if (!type || !["image", "audio"].includes(type)) {
      return res.status(400).json({ message: "Tipo inválido. Usa 'image' o 'audio'." });
    }

    // Nombre del archivo REAL
    const name = file.originalname;

    const info = await uploadToCloudinary(file.path, "TodoAppRoll");

    const newMedia = await prisma.media.create({
      data: {
        userId: req.userId!,
        name,
        url: info.url,
        type,
        publicId: info.publicId,
      },
    });

    await fs.unlink(file.path).catch(() => {});

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

    if (existing.publicId) {
      await deleteFromCloudinary(existing.publicId).catch((e) =>
        console.warn("Cloudinary destroy warning:", e)
      );
    }

    await prisma.media.delete({ where: { id } });
    res.json({ message: "Archivo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar multimedia:", error);
    res.status(500).json({ message: "Error al eliminar multimedia" });
  }
};
