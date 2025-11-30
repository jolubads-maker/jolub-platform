
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
