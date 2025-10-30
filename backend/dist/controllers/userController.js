"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateProfile = exports.getProfile = void 0;
const prismaService_1 = __importDefault(require("../services/prismaService"));
const historyService_1 = require("../services/historyService");
// Obtener perfil de usuario autenticado
const getProfile = async (req, res) => {
    try {
        const user = await prismaService_1.default.user.findUnique({
            where: { id: req.userId },
            select: { id: true, username: true, createdAt: true },
        });
        if (!user)
            return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(user);
    }
    catch (error) {
        console.error("Error al obtener el perfil:", error);
        res.status(500).json({ message: "Error al obtener el perfil de usuario" });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { username, password } = req.body;
        const existing = await prismaService_1.default.user.findUnique({
            where: { id: req.userId },
        });
        if (!existing)
            return res.status(404).json({ message: "Usuario no encontrado" });
        const update = await prismaService_1.default.user.update({
            where: { id: req.userId },
            data: { username, passHash: password || existing.passHash },
        });
        await (0, historyService_1.logHistory)(req.userId, "User", "UPDATE_PROFILE", { username, passwordChanged: !!password });
        res.json({ message: "Perfil actualizado correctamente", update });
    }
    catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ message: "Error al actualizar perfil" });
    }
};
exports.updateProfile = updateProfile;
const deleteAccount = async (req, res) => {
    try {
        const user = await prismaService_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user)
            return res.status(404).json({ message: "Usuario no encontrado" });
        await prismaService_1.default.user.delete({ where: { id: req.userId } });
        await (0, historyService_1.logHistory)(req.userId, "User", "DELETE", { username: user.username });
        res.json({ message: "Cuenta eliminada correctamente" });
    }
    catch (error) {
        console.error("Error al eliminar cuenta:", error);
        res.status(500).json({ message: "Error al eliminar cuenta" });
    }
};
exports.deleteAccount = deleteAccount;
