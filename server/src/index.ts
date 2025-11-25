import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './database';

// Routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import adsRoutes from './routes/ads.routes';
import chatRoutes from './routes/chat.routes';
import favoritesRoutes from './routes/favorites.routes';
import uploadRoutes from './routes/upload.routes';
import { sendMessage } from './controllers/chat.controller';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Routes Mounting
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api', chatRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api', uploadRoutes);

// Socket.io Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`👤 Usuario ${socket.id} se unió al chat: ${chatId}`);
    });

    socket.on('send_message', async (data) => {
        const { chatId, userId, text, sender } = data;
        try {
            // We need to manually call the logic here since it's not an HTTP request
            // But we can reuse the prisma call directly or extract logic to a service
            // For now, let's duplicate the simple prisma call or import it
            // I'll use prisma directly here as in the original code

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
        console.log('❌ Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 4000;
const server = httpServer.listen(PORT, () => {
    console.log(`API server on http://localhost:${PORT}`);
    console.log(`📊 Base de datos SQLite conectada (Prisma)`);
    console.log(`🚀 Socket.io listo`);
});

server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please close the process using this port or use a different PORT.`);
    } else {
        console.error('❌ Server error:', e);
    }
    process.exit(1);
});
