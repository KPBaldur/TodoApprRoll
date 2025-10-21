import { Request, Response, NextFunction } from "express";

// Middleware temporal de autenticación (placeholder)
// En fases posteriores, integrar JWT/sesiones. Por ahora usa header 'x-user-id'.
export function auth(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id") || "demo-user";
  (req as any).userId = userId;
  next();
}