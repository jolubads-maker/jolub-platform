import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
// import * as Sentry from "@sentry/node";
// import { ProfilingIntegration } from "@sentry/profiling-node";
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import adsRoutes from './routes/ads.routes.js';
import chatRoutes from './routes/chat.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import healthRoutes from './routes/health.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Initialize Sentry
/*
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js tracing
        new Sentry.Integrations.Express({ app }),
        // new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());
*/

// Security: Helmet (Secure HTTP Headers)
app.use(helmet());

// Security: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all requests
app.use(limiter);

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Security
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'https://www.jolub.com',
    'https://jolub.com',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowedOrigins
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Allow Vercel preview deployments
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // Allow local network IPs in development ONLY
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://192.168.')) {
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
app.use('/api/favorites', favoritesRoutes);
app.use('/api', uploadRoutes);
app.use('/api', healthRoutes);
app.use('/api/admin', adminRoutes);

// The error handler must be before any other error middleware and after all controllers
// app.use(Sentry.Handlers.errorHandler());

// Error Handling Middleware (Must be last)
app.use(errorHandler as any);

export default app;
export { allowedOrigins };
