import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import prisma from './database';
import { initSocket } from './socket';

// Routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import adsRoutes from './routes/ads.routes';
import chatRoutes from './routes/chat.routes';
import favoritesRoutes from './routes/favorites.routes';
import uploadRoutes from './routes/upload.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security: Helmet (Secure Headers)
// app.use(helmet());

// Security: Rate Limiting
import { rateLimiter } from './middleware/rateLimiter';

// ...

// Global Request Logger
app.use((req, res, next) => {
    console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
    next();
});

// Security: Rate Limiting (Redis)
// app.use(rateLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS Security
// CORS Security
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost', // Allow default port 80
    'http://127.0.0.1:3000',
    'http://192.168.0.16:81', // Specific user IP
    'http://192.168.0.19', // Local network testing
    'http://192.168.0.19:80',
    'http://192.168.0.19:5173',
    'https://www.jolub.com',
    'https://jolub.com',
    process.env.CLIENT_URL // Production URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowedOrigins
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Allow local network IPs in development
        if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://192.168.') || origin.startsWith('http://10.'))) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
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
app.use('/api', favoritesRoutes);
app.use('/api', uploadRoutes);
app.use('/api', healthRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    // Serve frontend static files
    app.use(express.static(path.join(__dirname, '../dist')));

    // Handle SPA routing - return index.html for any unknown route (except /api)
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../dist/index.html'));
        }
    });
}

// Error Handling Middleware (Must be last)
app.use(errorHandler);

// Socket.io Setup
const httpServer = createServer(app);
const io = initSocket(httpServer, allowedOrigins as string[]);

const PORT = process.env.PORT || 4000;
import logger from './utils/logger';

// ...

const server = httpServer.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`API server on http://0.0.0.0:${PORT}`);
    logger.info(`📊 Base de datos conectada (Neon Tech / PostgreSQL)`);
    logger.info(`🚀 Socket.io listo (Secure Mode)`);
});

server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Please close the process using this port or use a different PORT.`);
    } else {
        logger.error(`❌ Server error: ${e}`);
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
