import { PrismaClient } from '@prisma/client';
import logger from './utils/logger.js';
// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
// Check for pooling URL in production
if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('pgbouncer') && !dbUrl.includes('pooler')) {
        logger.warn('⚠️ ADVERTENCIA: DATABASE_URL podría no estar usando Connection Pooling (Neon/PgBouncer). Verifica tu configuración para evitar agotar conexiones.');
    }
}
export default prisma;
