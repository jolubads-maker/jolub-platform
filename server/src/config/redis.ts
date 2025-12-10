import { Redis } from 'ioredis';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL;

// Si no hay REDIS_URL configurada, no intentar conectar
let redis: Redis | null = null;

if (REDIS_URL && REDIS_URL !== '' && REDIS_URL !== 'redis://localhost:6379') {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        commandTimeout: 3000,
        retryStrategy(times: number) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError: (err: Error) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
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

    redis.on('error', (err: Error) => {
        logger.error('❌ Error de conexión Redis:', err.message);
    });
} else {
    logger.info('⚠️ Redis no configurado - Socket.io funcionará en modo memoria');
}

export default redis;
export const isRedisEnabled = redis !== null;
