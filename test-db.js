import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('🔍 Attempting to connect to database...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

        await prisma.$connect();
        console.log('✅ Conexión a la base de datos exitosa');

        const userCount = await prisma.user.count();
        console.log(`📊 Usuarios en la base de datos: ${userCount}`);
    } catch (e) {
        console.error('❌ Error conectando a la base de datos:');
        console.error('Error name:', e.name);
        console.error('Error message:', e.message);
        console.error('Error code:', e.errorCode);
        console.error('Full error:', JSON.stringify(e, null, 2));
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
