import { Request, Response } from "express";

export async function whoami(req: Request, res: Response) {
  res.json({ ok: true, userId: (req as any).userId || null });
}