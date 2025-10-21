import { Request, Response } from "express";
import * as taskService from "../services/taskService";
import { z } from "zod";

export async function list(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const tasks = await taskService.listByUser(userId);
  res.json({ ok: true, data: tasks });
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export async function create(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const task = await taskService.create(userId, parsed.data);
  res.status(201).json({ ok: true, data: task });
}

export async function remove(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { id } = req.params;
  await taskService.remove(userId, id);
  res.json({ ok: true });
}