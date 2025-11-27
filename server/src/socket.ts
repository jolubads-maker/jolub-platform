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
                // Verificar si el chat existe, si no, crearlo
                let chat = await prisma.chatLog.findUnique({ where: { id: chatId } });
                console.log(`🔍 Buscando chat ${chatId}:`, chat ? 'Encontrado' : 'No encontrado');

                if (!chat) {
                    // Intentar derivar participantes del chatId (ej: "1-2")
                    const parts = chatId.split('-');
                    if (parts.length === 2) {
                        const p1 = parseInt(parts[0]);
                        const p2 = parseInt(parts[1]);
                        if (!isNaN(p1) && !isNaN(p2)) {
                            console.log(`🆕 Intentando crear chat: ${chatId} con participantes ${p1}, ${p2}`);
                            chat = await prisma.chatLog.create({
                                data: {
                                    id: chatId,
                                    updatedAt: new Date()
                                }
                            });
                            console.log('✅ ChatLog creado');

                            // Crear entradas de ChatParticipant para ambos participantes
                            await prisma.chatParticipant.createMany({
                                data: [
                                    { userId: p1, chatId },
                                    { userId: p2, chatId }
                                ],
                                skipDuplicates: true
                            });
                            console.log('✅ Participantes añadidos');
                        }
                    }
                }

                if (!chat) {
                    console.error(`❌ No se pudo encontrar ni crear el chat: ${chatId}`);
                    if (callback) callback({ status: 'error', error: 'Chat creation failed' });
                    return;
                }

                console.log('💾 Guardando mensaje en DB...');
                const message = await prisma.message.create({
                    data: {
                        chatId,
                        userId: Number(userId),
                        text,
                        sender
                    },
                    include: { user: true }
                });
                console.log('✅ Mensaje guardado:', message.id);

                // Update chat updatedAt
                await prisma.chatLog.update({
                    where: { id: chatId },
                    data: { updatedAt: new Date() }
                });

                // Emit to room
                console.log(`📡 Emitiendo 'receive_message' a sala ${chatId}`);
                io.to(chatId).emit('receive_message', message);

                // Acknowledge success
                if (callback) callback({ status: 'ok', message });

            } catch (error: any) {
                console.error('❌ Error CRÍTICO enviando mensaje socket:', error);
                if (callback) callback({ status: 'error', error: error.message || 'Server error' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`❌ Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
};
