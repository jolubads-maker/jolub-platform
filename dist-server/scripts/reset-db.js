import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function main() {
    console.log('🗑️  Starting database reset...');
    try {
        // Delete in order of dependency (child -> parent)
        console.log('Deleting Messages...');
        await prisma.message.deleteMany({});
        console.log('Deleting ChatParticipants...');
        await prisma.chatParticipant.deleteMany({});
        console.log('Deleting ChatLogs...');
        await prisma.chatLog.deleteMany({});
        console.log('Deleting Media...');
        await prisma.media.deleteMany({});
        console.log('Deleting Favorites...');
        await prisma.favorite.deleteMany({});
        console.log('Deleting Ads...');
        await prisma.ad.deleteMany({});
        console.log('Deleting VerificationCodes...');
        await prisma.verificationCode.deleteMany({});
        console.log('Deleting Users...');
        await prisma.user.deleteMany({});
        console.log('✅ Database reset complete!');
    }
    catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
