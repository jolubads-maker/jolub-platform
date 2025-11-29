import Redis from 'ioredis';
import logger from '../utils/logger';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});
redis.on('connect', () => {
    logger.info('✅ Redis conectado');
});
redis.on('error', (err) => {
    // In production, we want to know about this. In dev, it's expected if no Redis is running.
    if (process.env.NODE_ENV === 'production') {
        logger.error('❌ Error de conexión Redis:', err);
    }
    else {
        // Suppress verbose errors in dev
        // logger.warn('⚠️ Redis no conectado (Modo Desarrollo)');
    }
});
export default redis;
