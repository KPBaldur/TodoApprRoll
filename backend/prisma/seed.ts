import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {

  const hashedPassword = await bcrypt.hash("123456", 10);
  
  const user = await prisma.user.create({
    data: {
      username: 'BaldurDev',
      passHash: hashedPassword,
    },
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Bienvenido a TodoApp v3.0',
      description: 'Primera tarea de prueba',
    },
  });

  console.log('✅ Seed completado con éxito');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
