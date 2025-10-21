import { getPrisma } from "../config/db";

type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
};

export async function listByUser(userId: string) {
  const prisma = getPrisma();
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function create(userId: string, data: CreateTaskInput) {
  const prisma = getPrisma();
  return prisma.task.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
}

export async function remove(userId: string, id: string) {
  const prisma = getPrisma();
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return;
  await prisma.task.delete({ where: { id } });
}