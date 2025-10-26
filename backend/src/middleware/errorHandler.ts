import { Request, Response, NextFunction } from "express";

export function erroHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error("Error: ", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
}