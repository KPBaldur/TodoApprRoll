import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Ejecutando seed...");

  // Limpieza opcional para desarrollo
  await prisma.history.deleteMany();
  await prisma.media.deleteMany();
  await prisma.alarm.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Contraseña con bcrypt
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Usuario inicial
  const user = await prisma.user.create({
    data: {
      username: "BaldurDev",
      passHash: hashedPassword,   // ← ESTE ES EL CAMPO CORRECTO
    },
  });

  // Tarea inicial
  await prisma.task.create({
    data: {
      userId: user.id,
      title: "Bienvenido a TodoApp v3.0",
      description: "Primera tarea de prueba",
      priority: "MEDIUM",
      status: "PENDING",
    },
  });

  console.log("✅ Seed completado con éxito → Usuario: BaldurDev / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
