import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      passHash: 'hashed_password_example',
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
