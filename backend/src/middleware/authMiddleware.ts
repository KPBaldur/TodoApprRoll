import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

export interface AuthRequest extends Request {
    userId?: string;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const header = req.headers.authorization;
        if (!header) 
            return res.status(401).json({ message: "Token Requerido"});

        const token = header.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Formato de autorizacion invalido" });
        
        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId)
            return res.status(403).json({ message: "Token invalido o expirado" });

        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("Error en authMiddleware:", error);
        return res.status(500).json({ message: "Error interno en autenticacion"});
    }    
};