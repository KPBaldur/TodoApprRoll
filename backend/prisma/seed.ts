import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Generando usuario BaldurDev...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      username: "BaldurDev",
      passHash: hashedPassword,
    },
  });

  console.log("🌱 Creando tarea inicial...");

  await prisma.task.create({
    data: {
      title: "Bienvenido a TodoApp v3.0",
      description: "Primera tarea de prueba",
      user: { connect: { username: "BaldurDev" } },
    },
  });

  console.log("✅ Seed completado con éxito");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
