import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Usuario admin fijo
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: "admin", // id legible para pruebas
      username: "admin",
      passHash: "{plaintext:admin}", // placeholder; se reemplazará por hash real en auth
    },
  });

  // Medios demo asociados al admin
  await prisma.media.createMany({
    data: [
      {
        id: "media-img-1",
        userId: admin.id,
        name: "Demo Image",
        url: "https://res.cloudinary.com/demo/image/upload/w_600/sample.jpg",
        publicId: "demo-image-1",
        type: "image",
        width: 600,
        height: 400,
      },
      {
        id: "media-audio-1",
        userId: admin.id,
        name: "Demo Audio",
        url: "https://res.cloudinary.com/demo/video/upload/acoustic-guitar.mp3",
        publicId: "demo-audio-1",
        type: "audio",
        durationSec: 30,
      },
      {
        id: "media-video-1",
        userId: admin.id,
        name: "Demo Video",
        url: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        publicId: "demo-video-1",
        type: "video",
        width: 640,
        height: 360,
        durationSec: 10,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completo: usuario admin y 3 media creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });