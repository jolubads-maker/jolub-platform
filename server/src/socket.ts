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

        socket.on('send_message', async (data) => {
            const { chatId, userId, text, sender } = data;

            // Validate sender identity
            if (user && user.id !== Number(userId)) {
                console.warn(`⚠️ Intento de suplantación: SocketUser ${user.id} intentó enviar como ${userId}`);
                return;
            }

            try {
                const message = await prisma.message.create({
                    data: {
                        chatId,
                        userId: Number(userId),
                        text,
                        sender
                    },
                    include: { user: true }
                });

                // Update chat updatedAt
                await prisma.chatLog.update({
                    where: { id: chatId },
                    data: { updatedAt: new Date() }
                });

                // Emit to room
                io.to(chatId).emit('receive_message', message);
            } catch (error) {
                console.error('Error enviando mensaje socket:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`❌ Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
};
