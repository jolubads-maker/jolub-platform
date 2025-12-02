import { Redis } from 'ioredis';
import logger from '../utils/logger.js';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false, // Permite reconexión más rápida en algunos entornos
    commandTimeout: 3000, // Timeout de 3s para comandos para evitar cuelgues
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            // Only reconnect when the error starts with "READONLY"
            return true;
        }
        return false;
    }
});
redis.on('connect', () => {
    logger.info('✅ Redis conectado');
});
redis.on('ready', () => {
    logger.info('🚀 Redis listo para recibir comandos');
});
redis.on('error', (err) => {
    // Evitar crash en producción, pero loguear el error
    if (process.env.NODE_ENV === 'production') {
        logger.error('❌ Error de conexión Redis:', err.message);
    }
    else {
        // En desarrollo, loguear warning para no ensuciar consola si no se usa
        // logger.warn('⚠️ Redis error (Dev):', err.message);
    }
});
export default redis;
