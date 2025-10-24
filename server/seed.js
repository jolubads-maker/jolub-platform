import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatLog.deleteMany();
  await prisma.media.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verificationCode.deleteMany();

  // Crear usuarios
  const user1 = await prisma.user.create({
    data: {
      name: 'Carlos Gomez',
      avatar: 'https://picsum.photos/seed/carlos/100/100',
      points: 450,
      phone: '528112345678',
      phoneVerified: true,
      isOnline: true,
      lastSeen: new Date()
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Ana Rodriguez',
      avatar: 'https://picsum.photos/seed/ana/100/100',
      points: 820,
      phone: '541187654321',
      phoneVerified: true,
      isOnline: false,
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
    }
  });

  console.log('✅ Usuarios creados:', user1.name, user2.name);

  // Crear anuncios
  const ad1 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now()}-laptop1`,
      title: 'Laptop Gamer casi nueva',
      description: 'Potente laptop con tarjeta gráfica RTX 3080, 32GB de RAM y 1TB SSD. Poco uso, perfecta para juegos y diseño.',
      price: 1500,
      views: 124,
      sellerId: user1.id,
      media: {
        create: [
          { type: 'image', url: 'https://picsum.photos/seed/laptop1/600/600' },
          { type: 'image', url: 'https://picsum.photos/seed/laptop2/600/600' }
        ]
      }
    }
  });

  const ad2 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now() + 1}-bike1`,
      title: 'Bicicleta de Montaña Profesional',
      description: 'Bicicleta de fibra de carbono, suspensión doble, frenos de disco hidráulicos. Ideal para senderos exigentes.',
      price: 950,
      views: 88,
      sellerId: user2.id,
      media: {
        create: [
          { type: 'video', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
          { type: 'image', url: 'https://picsum.photos/seed/bike2/600/600' }
        ]
      }
    }
  });

  const ad3 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now() + 2}-camera1`,
      title: 'Cámara DSLR Canon EOS',
      description: 'Incluye lente 18-55mm, batería y cargador. Excelente estado, ideal para fotógrafos principiantes y aficionados.',
      price: 450,
      views: 210,
      sellerId: user1.id,
      media: {
        create: [
          { type: 'image', url: 'https://picsum.photos/seed/camera1/600/600' }
        ]
      }
    }
  });

  console.log('✅ Anuncios creados:', ad1.title, ad2.title, ad3.title);

  // Crear un chat de ejemplo
  const chatId = [user1.id, user2.id].sort().join('-');
  const chat = await prisma.chatLog.create({
    data: {
      id: chatId,
      adId: ad1.id,
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id }
        ]
      },
      messages: {
        create: [
          {
            userId: user2.id,
            text: 'Hola! Me interesa tu laptop, ¿está disponible?',
            sender: 'buyer'
          },
          {
            userId: user1.id,
            text: '¡Hola! Sí, está disponible. ¿Te gustaría verla en persona?',
            sender: 'seller'
          },
          {
            userId: user2.id,
            text: 'Perfecto, ¿podríamos quedar mañana?',
            sender: 'buyer'
          }
        ]
      }
    }
  });

  console.log('✅ Chat de ejemplo creado');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
