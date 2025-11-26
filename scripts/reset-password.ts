import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'creadorweb505@gmail.com';
    const newPassword = 'asdfgh';

    console.log(`Resetting password for: ${email}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Upsert user: create if not exists, update if exists
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            provider: 'manual',
            providerId: null, // Clear providerId if switching to manual
        },
        create: {
            email,
            name: 'Creador Web',
            username: 'creadorweb505',
            password: hashedPassword,
            provider: 'manual',
            uniqueId: `USER-${Date.now()}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            points: 0,
            isOnline: true,
            lastSeen: new Date(),
        }
    });

    console.log('User updated successfully:', {
        id: user.id,
        email: user.email,
        provider: user.provider
    });
}

resetPassword()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
