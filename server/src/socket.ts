import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import prisma from './database';

interface SocketUser {
    id: number;
    username: string | null;
}

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

    // Socket.io Security Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const user = await prisma.user.findUnique({
                where: { sessionToken: token }
            });

            if (!user) {
                return next(new Error('Authentication error: Invalid token'));
            }

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

                // 4. Emitir a la sala
                io.to(chatId).emit('receive_message', {
                    ...newMessage,
                    timestamp: newMessage.createdAt
                });

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

        socket.on('disconnect', () => {
            console.log(`❌ Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
};
