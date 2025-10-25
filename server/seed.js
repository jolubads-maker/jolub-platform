import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatLog.deleteMany();
  await prisma.favorite.deleteMany(); // Nueva tabla
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

  // Crear anuncios con categorías y ubicaciones
  const ad1 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now()}-laptop1`,
      title: 'Laptop Gamer casi nueva',
      description: 'Potente laptop con tarjeta gráfica RTX 3080, 32GB de RAM y 1TB SSD. Poco uso, perfecta para juegos y diseño.',
      price: 1500,
      category: 'Electrónica',
      location: 'Ciudad de México, CDMX',
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
      category: 'Deportes',
      location: 'Guadalajara, Jalisco',
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
      category: 'Electrónica',
      location: 'Monterrey, Nuevo León',
      views: 210,
      sellerId: user1.id,
      media: {
        create: [
          { type: 'image', url: 'https://picsum.photos/seed/camera1/600/600' }
        ]
      }
    }
  });

  const ad4 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now() + 3}-car1`,
      title: 'Toyota Corolla 2020',
      description: 'Sedan familiar en excelente estado, único dueño, todas las revisiones en agencia. Km: 35,000.',
      price: 18500,
      category: 'Vehículos',
      location: 'Puebla, Puebla',
      views: 342,
      sellerId: user2.id,
      media: {
        create: [
          { type: 'image', url: 'https://picsum.photos/seed/car1/600/600' },
          { type: 'image', url: 'https://picsum.photos/seed/car2/600/600' }
        ]
      }
    }
  });

  const ad5 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now() + 4}-sofa1`,
      title: 'Sofá de 3 Plazas Moderno',
      description: 'Sofá en tela gris, muy cómodo y en perfecto estado. Medidas: 220cm x 90cm x 85cm.',
      price: 750,
      category: 'Hogar',
      location: 'Querétaro, Querétaro',
      views: 156,
      sellerId: user1.id,
      media: {
        create: [
          { type: 'image', url: 'https://picsum.photos/seed/sofa1/600/600' }
        ]
      }
    }
  });

  const ad6 = await prisma.ad.create({
    data: {
      uniqueCode: `AD-${Date.now() + 5}-jacket1`,
      title: 'Chamarra de Cuero Negra',
      description: 'Chamarra 100% cuero genuino, talla M, estilo motociclista. Poco uso, excelente calidad.',
      price: 280,
      category: 'Moda',
      location: 'Ciudad de México, CDMX',
      views: 92,
      sellerId: user2.id,
      media: {
        create: [
          { type: 'image', url: 'https://picsum.photos/seed/jacket1/600/600' }
        ]
      }
    }
  });

  console.log('✅ Anuncios creados:', ad1.title, ad2.title, ad3.title, ad4.title, ad5.title, ad6.title);

  // Crear favoritos de ejemplo
  await prisma.favorite.create({
    data: {
      userId: user2.id,
      adId: ad1.id
    }
  });

  await prisma.favorite.create({
    data: {
      userId: user2.id,
      adId: ad3.id
    }
  });

  await prisma.favorite.create({
    data: {
      userId: user1.id,
      adId: ad2.id
    }
  });

  console.log('✅ Favoritos creados');

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
