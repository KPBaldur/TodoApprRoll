"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const token_1 = require("../utils/token");
const authenticateToken = (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header)
            return res.status(401).json({ message: "Token Requerido" });
        const token = header.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Formato de autorizacion invalido" });
        const decoded = (0, token_1.verifyToken)(token);
        if (!decoded || !decoded.userId)
            return res.status(403).json({ message: "Token invalido o expirado" });
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        console.error("Error en authMiddleware:", error);
        return res.status(500).json({ message: "Error interno en autenticacion" });
    }
};
exports.authenticateToken = authenticateToken;
