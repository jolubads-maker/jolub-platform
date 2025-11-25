import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Configuración de Prisma con Optimize (opcional)
const createPrismaClient = async () => {
  const client = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  // Intentar cargar Prisma Optimize solo si está configurado
  if (process.env.OPTIMIZE_API_KEY) {
    try {
      const { withOptimize } = await import('@prisma/extension-optimize');
      console.log('✅ Prisma Optimize habilitado');
      return client.$extends(
        withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY })
      );
    } catch (error) {
      console.log('⚠️ Prisma Optimize no disponible (módulo no instalado)');
      return client;
    }
  }

  console.log('ℹ️ Prisma funcionando en modo estándar');
  return client;
};

// Crear una instancia global de Prisma para evitar múltiples conexiones
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || await createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Funciones de utilidad para la base de datos
export const dbUtils = {
  // Verificar disponibilidad de nombre de usuario
  async checkUsernameAvailability(username) {
    if (!username || username.trim().length === 0) {
      return false; // No disponible si está vacío
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    console.log(`🔍 Checking username "${username}":`, user ? 'OCUPADO' : 'DISPONIBLE');
    return !user; // true si está disponible
  },

  // Verificar disponibilidad de email
  async checkEmailAvailability(email) {
    if (!email || email.trim().length === 0 || !email.includes('@')) {
      return false; // No disponible si está vacío o inválido
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    console.log(`🔍 Checking email "${email}":`, user ? 'OCUPADO' : 'DISPONIBLE');
    return !user; // true si está disponible
  },

  // Crear o encontrar un usuario
  async findOrCreateUser(userData) {
    // Buscar por providerId si está disponible, sino por nombre
    let user = null;
    if (userData.providerId) {
      user = await prisma.user.findFirst({
        where: {
          providerId: userData.providerId,
          provider: userData.provider
        }
      });
    }

    // Buscar por email si existe
    if (!user && userData.email) {
      user = await prisma.user.findFirst({
        where: { email: userData.email }
      });
    }

    // Buscar por username si existe
    if (!user && userData.username) {
      user = await prisma.user.findFirst({
        where: { username: userData.username }
      });
    }

    if (!user) {
      // Generar ID único para el usuario (ej: "USER-1234567890")
      const uniqueId = `USER-${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Generar avatar por defecto si no viene uno
      const defaultAvatar = userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email || uniqueId}`;

      user = await prisma.user.create({
        data: {
          uniqueId: uniqueId,
          username: userData.username || null,
          name: userData.name,
          avatar: defaultAvatar,
          email: userData.email || null,
          provider: userData.provider || 'manual',
          providerId: userData.providerId || null,
          points: 0,
          phoneVerified: false,
          isOnline: true,
          lastSeen: new Date(),
          ip: userData.ip || null,
          country: userData.country || null
        }
      });
    } else {
      // Actualizar datos existentes
      const updateData = {
        email: userData.email || user.email,
        provider: userData.provider || user.provider,
        providerId: userData.providerId || user.providerId,
        isOnline: true,
        lastSeen: new Date(),
        ip: userData.ip || user.ip,
        country: userData.country || user.country
      };

      // Solo actualizar avatar si viene uno nuevo (no vacío)
      if (userData.avatar) {
        updateData.avatar = userData.avatar;
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
    }

    return user;
  },

  // Crear un anuncio
  async createAd(adData) {
    // Generar código único para el anuncio
    const uniqueCode = `AD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return await prisma.ad.create({
      data: {
        uniqueCode: uniqueCode,
        title: adData.title,
        description: adData.description,
        details: adData.details,
        price: adData.price,
        sellerId: adData.sellerId,
        media: {
          create: adData.media.map(m => ({
            type: m.type,
            url: m.url
          }))
        }
      },
      include: {
        media: true,
        seller: true
      }
    });
  },

  // Obtener todos los anuncios con sus vendedores (con filtros opcionales)
  async getAllAds(filters = {}) {
    const { category, minPrice, maxPrice, location, search, userId } = filters;

    const where = {};

    if (category && category !== 'Todas') {
      where.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { uniqueCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Optimizar query: solo incluir lo necesario
    const ads = await prisma.ad.findMany({
      where,
      include: {
        media: {
          take: 10 // Limitar media para evitar cargar demasiado
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isOnline: true,
            phoneVerified: true
          }
        },
        favorites: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limitar resultados para mejor rendimiento
    });

    // Agregar flag isFavorite si hay userId
    if (userId) {
      return ads.map(ad => ({
        ...ad,
        isFavorite: ad.favorites && ad.favorites.length > 0,
        favorites: undefined // Remover el array de favoritos del resultado
      }));
    }

    return ads;
  },

  // Obtener anuncios de un usuario
  async getUserAds(userId) {
    return await prisma.ad.findMany({
      where: { sellerId: userId },
      include: {
        media: true,
        seller: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Incrementar vistas de un anuncio
  async incrementAdViews(adId) {
    return await prisma.ad.update({
      where: { id: adId },
      data: { views: { increment: 1 } }
    });
  },

  // Crear o encontrar un chat
  async findOrCreateChat(participantIds) {
    const sortedIds = participantIds.sort();
    const chatId = sortedIds.join('-');

    let chat = await prisma.chatLog.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: { user: true }
        },
        messages: {
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      // Crear el chat
      chat = await prisma.chatLog.create({
        data: {
          id: chatId,
          participants: {
            create: sortedIds.map(userId => ({
              userId: userId
            }))
          }
        },
        include: {
          participants: {
            include: { user: true }
          },
          messages: {
            include: { user: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    }

    return chat;
  },

  // Enviar un mensaje
  async sendMessage(chatId, userId, text, sender) {
    const message = await prisma.message.create({
      data: {
        chatId: chatId,
        userId: userId,
        text: text,
        sender: sender
      },
      include: { user: true }
    });

    return message;
  },

  // Obtener chats de un usuario (optimizado)
  async getUserChats(userId) {
    return await prisma.chatParticipant.findMany({
      where: { userId: userId },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    isOnline: true,
                    lastSeen: true
                  }
                }
              }
            },
            messages: {
              select: {
                id: true,
                text: true,
                sender: true,
                userId: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: {
        chat: {
          updatedAt: 'desc'
        }
      },
      take: 50 // Limitar a 50 chats más recientes
    });
  },

  // Actualizar estado en línea de un usuario
  async updateUserOnlineStatus(userId, isOnline) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: isOnline,
        lastSeen: new Date()
      }
    });
  },

  // Actualizar avatar de usuario
  async updateUserAvatar(userId, avatarUrl) {
    return await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    });
  },

  // Verificar teléfono de un usuario
  async verifyUserPhone(userId, phoneNumber) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phoneNumber,
        phoneVerified: true
      }
    });
  },

  // Crear verificación de teléfono
  async createPhoneVerification(phone, code) {
    // Eliminar códigos existentes
    await prisma.verificationCode.deleteMany({
      where: { contact: phone, type: 'phone' }
    });

    return await prisma.verificationCode.create({
      data: {
        contact: phone,
        type: 'phone',
        code: code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
  },

  // Verificar teléfono
  async verifyPhone(phone, code) {
    const verificationCode = await prisma.verificationCode.findUnique({
      where: {
        contact_type: {
          contact: phone,
          type: 'phone'
        }
      }
    });

    if (!verificationCode || verificationCode.code !== code) {
      return { valid: false, error: 'Código incorrecto' };
    }

    if (verificationCode.expiresAt < new Date()) {
      await prisma.verificationCode.delete({
        where: { id: verificationCode.id }
      });
      return { valid: false, error: 'Código expirado' };
    }

    // Código válido: Eliminarlo
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id }
    });

    // Actualizar usuario(s) con este teléfono
    await prisma.user.updateMany({
      where: { phone: phone },
      data: { phoneVerified: true }
    });

    return { valid: true };
  },

  // Crear verificación de email
  async createEmailVerification(email, code) {
    // Eliminar códigos existentes
    await prisma.verificationCode.deleteMany({
      where: { contact: email, type: 'email' }
    });

    return await prisma.verificationCode.create({
      data: {
        contact: email,
        type: 'email',
        code: code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
  },

  // Verificar email
  async verifyEmail(email, code) {
    const verificationCode = await prisma.verificationCode.findUnique({
      where: {
        contact_type: {
          contact: email,
          type: 'email'
        }
      }
    });

    if (!verificationCode || verificationCode.code !== code) {
      return { valid: false, error: 'Código incorrecto' };
    }

    if (verificationCode.expiresAt < new Date()) {
      await prisma.verificationCode.delete({
        where: { id: verificationCode.id }
      });
      return { valid: false, error: 'Código expirado' };
    }

    // Código válido: Eliminarlo
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id }
    });

    // Actualizar usuario(s) con este email
    await prisma.user.updateMany({
      where: { email: email },
      data: { emailVerified: true }
    });

    return { valid: true };
  },

  // Verificar email de un usuario
  async verifyUserEmail(email) {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return null;
    }

    return await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true
      }
    });
  },

  // Generar token de sesión
  async generateSessionToken(userId) {
    const sessionToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: userId },
      data: { sessionToken: sessionToken }
    });

    return sessionToken;
  },

  // Autenticación con token
  async authenticateWithToken(sessionToken) {
    const user = await prisma.user.findUnique({
      where: { sessionToken: sessionToken }
    });

    if (!user) {
      return null;
    }

    // Actualizar último acceso
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date()
      }
    });

    return user;
  },

  // Búsqueda de anuncios
  async searchAds(query) {
    const searchTerm = `%${query}%`;

    return await prisma.ad.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { details: { contains: query, mode: 'insensitive' } },
          { uniqueCode: { contains: query, mode: 'insensitive' } },
          {
            seller: {
              name: { contains: query, mode: 'insensitive' }
            }
          }
        ]
      },
      include: {
        media: true,
        seller: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  // Agregar anuncio a favoritos
  async addFavorite(userId, adId) {
    return await prisma.favorite.create({
      data: {
        userId,
        adId
      }
    });
  },

  // Eliminar anuncio de favoritos
  async removeFavorite(userId, adId) {
    return await prisma.favorite.deleteMany({
      where: {
        userId,
        adId
      }
    });
  },

  // Obtener favoritos de un usuario
  async getUserFavorites(userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        ad: {
          include: {
            media: true,
            seller: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return favorites.map(fav => ({
      ...fav.ad,
      isFavorite: true
    }));
  },

  // Verificar si un anuncio es favorito
  async isFavorite(userId, adId) {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        adId
      }
    });

    return !!favorite;
  },

  // Destacar un anuncio
  async featureAd(adId, durationDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

    return await prisma.ad.update({
      where: { id: adId },
      data: {
        isFeatured: true,
        featuredExpiresAt: expiresAt
      }
    });
  }
};

