import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Token Requerido"});

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(403).json({ message: "Token invalido"});

    (req as any).userId = decoded.userId;
    next();
}