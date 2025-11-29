import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import prisma from './database';

interface SocketUser {
    id: number;
    username: string | null;
}

import { createAdapter } from '@socket.io/redis-adapter';
import redis from './config/redis';

export const initSocket = (httpServer: HttpServer, allowedOrigins: string[]) => {
    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    const pubClient = redis;
    const subClient = redis.duplicate();

    // Prevent crash on Redis error
    pubClient.on('error', (err) => {
        console.error('❌ Redis Pub Client Error:', err);
    });
    subClient.on('error', (err) => {
        console.error('❌ Redis Sub Client Error:', err);
    });

    // Only use Redis adapter in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production') {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('🔌 Socket.io usando Redis Adapter');
    } else {
        console.log('⚠️ Socket.io corriendo en memoria (Modo Desarrollo)');
    }

    // Socket.io Security Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            console.log('🔐 Socket Auth Attempt:', { socketId: socket.id, token: token ? `${token.substring(0, 10)}...` : 'MISSING' });

            if (!token) {
                console.error('❌ Socket Auth Failed: No token provided');
                return next(new Error('Authentication error: No token provided'));
            }

            const user = await prisma.user.findUnique({
                where: { sessionToken: token }
            });

            if (!user) {
                console.error('❌ Socket Auth Failed: Invalid token (User not found)', { token: `${token.substring(0, 10)}...` });
                return next(new Error('Authentication error: Invalid token'));
            }

            console.log('✅ Socket Auth Success:', { userId: user.id, username: user.username });

            // Attach user to socket
            socket.data.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Server error'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user;
        console.log(`🔌 Cliente conectado: ${socket.id} (User: ${user?.username || 'Unknown'})`);

        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            console.log(`👤 Usuario ${user?.username} se unió al chat: ${chatId}`);
        });

        // Join user-specific room for notifications
        if (user) {
            const userRoom = `user_${user.id}`;
            socket.join(userRoom);
            console.log(`👤 Usuario ${user.username} se unió a su sala personal: ${userRoom}`);
        }

        socket.on('send_message', async (data, callback) => {
            const { chatId, userId, text, sender } = data;

            // Validate sender identity
            if (user && user.id !== Number(userId)) {
                console.warn(`⚠️ Intento de suplantación: SocketUser ${user.id} intentó enviar como ${userId}`);
                if (callback) callback({ status: 'error', error: 'Identity mismatch' });
                return;
            }

            console.log(`📨 Recibido send_message:`, data);

            try {
                // 1. Verificar si el chat existe y si está bloqueado
                let chat = await prisma.chatLog.findUnique({
                    where: { id: chatId },
                    include: { participants: true }
                });

                if (!chat) {
                    // Lógica de creación de chat (existente)
                    const parts = chatId.split('-');
                    if (parts.length === 2) {
                        const p1 = parseInt(parts[0]);
                        const p2 = parseInt(parts[1]);
                        if (!isNaN(p1) && !isNaN(p2)) {
                            chat = await prisma.chatLog.create({
                                data: { id: chatId, updatedAt: new Date() },
                                include: { participants: true }
                            });
                            await prisma.chatParticipant.createMany({
                                data: [{ userId: p1, chatId }, { userId: p2, chatId }],
                                skipDuplicates: true
                            });
                        }
                    }
                }

                if (!chat) {
                    console.error(`❌ No se pudo encontrar ni crear el chat: ${chatId}`);
                    if (callback) callback({ status: 'error', error: 'Chat creation failed' });
                    return;
                }

                // CHECK BLOCKING
                if (chat.isBlocked) {
                    console.warn(`⚠️ Chat ${chatId} está bloqueado. Mensaje rechazado.`);
                    if (callback) callback({ status: 'error', error: 'Chat is blocked' });
                    return;
                }

                // 2. Guardar mensaje en DB
                const newMessage = await prisma.message.create({
                    data: {
                        chatId,
                        userId: Number(userId),
                        text,
                        sender,
                        isRead: false // Por defecto no leído
                    }
                });

                // 3. Actualizar timestamp del chat
                await prisma.chatLog.update({
                    where: { id: chatId },
                    data: { updatedAt: new Date() }
                });

                // 4. Emitir a la sala del chat
                io.to(chatId).emit('receive_message', {
                    ...newMessage,
                    timestamp: newMessage.createdAt,
                    tempId: data.tempId // Echo back the tempId for optimistic UI reconciliation
                });

                // 5. Emitir notificación al destinatario (si no es el remitente)
                const recipientId = chat.participants.find(p => p.userId !== Number(userId))?.userId;
                if (recipientId) {
                    const notificationData = {
                        chatId,
                        senderName: user?.username || 'Usuario', // Or fetch sender name properly
                        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                        adId: chat.adId // Include adId if available
                    };
                    io.to(`user_${recipientId}`).emit('new_message_notification', notificationData);
                    console.log(`🔔 Notificación enviada a user_${recipientId}`, notificationData);
                }

                console.log(`✅ [SERVER] Mensaje guardado y emitido: ${newMessage.id}`);
                if (callback) callback({ status: 'ok', message: newMessage });

            } catch (error: any) {
                console.error('❌ Error procesando mensaje:', error);
                if (callback) callback({ status: 'error', error: error.message || 'Server error' });
            }
        });

        // MARCAR LEÍDO
        socket.on('mark_read', async (data) => {
            const { chatId, userId } = data; // userId es quien LEE los mensajes (el receptor)
            try {
                // Marcar como leídos los mensajes que NO son míos en este chat
                await prisma.message.updateMany({
                    where: {
                        chatId,
                        userId: { not: Number(userId) }, // Mensajes del OTRO usuario
                        isRead: false
                    },
                    data: { isRead: true }
                });

                // Notificar a la sala que los mensajes fueron leídos
                io.to(chatId).emit('messages_read', { chatId, readerId: userId });
                console.log(`👀 [SERVER] Mensajes marcados como leídos en chat ${chatId} por usuario ${userId}`);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // BLOQUEAR CHAT
        socket.on('block_chat', async (data, callback) => {
            const { chatId, userId } = data; // userId es quien bloquea
            try {
                await prisma.chatLog.update({
                    where: { id: chatId },
                    data: {
                        isBlocked: true,
                        blockedBy: Number(userId)
                    }
                });

                io.to(chatId).emit('chat_blocked', { chatId, blockedBy: userId });
                console.log(`🚫 [SERVER] Chat ${chatId} bloqueado por usuario ${userId}`);
                if (callback) callback({ status: 'ok' });
            } catch (error) {
                console.error('Error blocking chat:', error);
                if (callback) callback({ status: 'error' });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`❌ Cliente desconectado: ${socket.id}`);
            if (user) {
                try {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { isOnline: false, lastSeen: new Date() }
                    });
                    console.log(`🔴 Usuario ${user.username} marcado como desconectado`);
                } catch (err) {
                    console.error('Error updating user offline status:', err);
                }
            }
        });
    });

    return io;
};
