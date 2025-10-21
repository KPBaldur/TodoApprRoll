import { Request, Response } from "express";

export async function notImplemented(_req: Request, res: Response) {
  res.status(501).json({ ok: false, error: "History API no implementada aún" });
}