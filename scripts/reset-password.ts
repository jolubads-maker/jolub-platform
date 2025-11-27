import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'creadorweb505@gmail.com';
    const newPassword = 'dinero2025';

    console.log(`Resetting password for ${email}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const user = await prisma.user.updateMany({
            where: { email },
            data: { password: hashedPassword }
        });

        if (user.count > 0) {
            console.log(`✅ Password updated successfully for ${email}`);
        } else {
            console.log(`❌ User ${email} not found`);
        }
    } catch (error) {
        console.error('Error updating password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
