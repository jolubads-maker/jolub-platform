import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import prisma from './database';

// Routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import adsRoutes from './routes/ads.routes';
import chatRoutes from './routes/chat.routes';
import favoritesRoutes from './routes/favorites.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Security
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL // Production URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes Mounting
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api', chatRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api', uploadRoutes);

// Error Handling Middleware (Must be last)
app.use(errorHandler);

// Socket.io Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.')) {
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

const PORT = process.env.PORT || 4000;
const server = httpServer.listen(PORT, () => {
    console.log(`API server on http://localhost:${PORT}`);
    console.log(`📊 Base de datos SQLite conectada (Prisma)`);
    console.log(`🚀 Socket.io listo (Secure Mode)`);
});

server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please close the process using this port or use a different PORT.`);
    } else {
        console.error('❌ Server error:', e);
    }
    process.exit(1);
});
