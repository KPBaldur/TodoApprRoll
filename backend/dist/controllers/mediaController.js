"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.uploadMedia = exports.getMedia = void 0;
const prismaService_1 = __importDefault(require("../services/prismaService"));
const getMedia = async (req, res) => {
    try {
        const media = await prismaService_1.default.media.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: "desc" },
        });
        res.json(media);
    }
    catch (error) {
        console.error("Error al obtener multimedia:", error);
        res.status(500).json({ message: "Error al obtener multimedia" });
    }
};
exports.getMedia = getMedia;
const uploadMedia = async (req, res) => {
    try {
        const { name, url, type, publicId } = req.body;
        if (!url || !publicId)
            return res.status(400).json({ message: "URL y publicId requeridos" });
        const newMedia = await prismaService_1.default.media.create({
            data: {
                userId: req.userId,
                name,
                url,
                type,
                publicId,
            },
        });
        res.status(201).json(newMedia);
    }
    catch (error) {
        console.error("Error al subir multimedia:", error);
        res.status(500).json({ message: "Error al subir multimedia" });
    }
};
exports.uploadMedia = uploadMedia;
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prismaService_1.default.media.findFirst({
            where: { id, userId: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: "Archivo no encontrado" });
        await prismaService_1.default.media.delete({ where: { id } });
        res.json({ message: "Archivo eliminado correctamente" });
    }
    catch (error) {
        console.error("Error al eliminar multimedia:", error);
        res.status(500).json({ message: "Error al eliminar multimedia" });
    }
};
exports.deleteMedia = deleteMedia;
