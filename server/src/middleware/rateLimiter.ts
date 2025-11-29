import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import logger from '../utils/logger';

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_WINDOW_REQUEST_COUNT = 100;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `rate_limit:${ip}`;

        // Skip if Redis is not connected to avoid hanging
        // In development, we can skip rate limiting or use memory (simple skip for now)
        if (redis.status !== 'ready' || process.env.NODE_ENV !== 'production') {
            return next();
        }

        const currentRequestCount = await redis.incr(key);

        if (currentRequestCount === 1) {
            await redis.expire(key, WINDOW_SIZE_IN_SECONDS);
        }

        if (currentRequestCount > MAX_WINDOW_REQUEST_COUNT) {
            return res.status(429).json({
                error: 'Demasiadas peticiones. Por favor intenta de nuevo más tarde.'
            });
        }

        next();
    } catch (error) {
        logger.error('Error en rate limiter:', error);
        // Fail open: allow request if Redis fails
        next();
    }
};
