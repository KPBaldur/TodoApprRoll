"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
// Contenido actual del archivo authController.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaService_1 = __importDefault(require("../services/prismaService"));
const tokenService_1 = require("../services/tokenService");
const historyService_1 = require("../services/historyService");
const register = async (req, res) => {
    const cout = await prismaService_1.default.user.count();
    if (cout > 0)
        return res.status(400).json({ message: "Registro deshabilitado. Sistema unipersonal" });
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "Username y password son requeridos." });
    try {
        const existingUser = await prismaService_1.default.user.findUnique({ where: { username } });
        if (existingUser)
            return res.status(400).json({ message: "El usuario ya existe." });
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await prismaService_1.default.user.create({
            data: { username, passHash: hashed },
        });
        // 🔥 Creamos la sesión usando el user.id real
        const session = await (0, tokenService_1.createSession)(user.id);
        await (0, historyService_1.logHistory)(user.id, "User", "REGISTER", { username });
        res.status(201).json({
            message: "Usuario creado exitosamente.",
            session,
        });
    }
    catch (err) {
        console.error("Error en el registro:", err);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prismaService_1.default.user.findUnique({ where: { username } });
        if (!user)
            return res.status(404).json({ message: "Usuario no encontrado." });
        const valid = await bcrypt_1.default.compare(password, user.passHash);
        if (!valid)
            return res.status(401).json({ message: "Password incorrecto." });
        // 🔥 Creamos la sesión y devolvemos ambos tokens
        const session = await (0, tokenService_1.createSession)(user.id);
        await (0, historyService_1.logHistory)(user.id, "User", "LOGIN", { timestamp: new Date() });
        res.json({
            message: "Inicio de sesión exitoso.",
            session,
        });
    }
    catch (err) {
        console.error("Error en el login:", err);
        res.status(500).json({ message: "Error en el servidor" });
    }
};
exports.login = login;
