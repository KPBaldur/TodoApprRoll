"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHistory = void 0;
const prismaService_1 = __importDefault(require("../services/prismaService"));
const getUserHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const history = await prismaService_1.default.history.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        res.json({ success: true, history });
    }
    catch (error) {
        console.error("[HISTORY] Error al obtener historial:", error);
        res.status(500).json({ success: false, message: "Error al obtener historial" });
    }
};
exports.getUserHistory = getUserHistory;
