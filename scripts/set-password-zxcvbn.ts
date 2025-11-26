import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setPassword() {
    const email = 'creadorweb505@gmail.com';
    const password = 'zxcvbn';

    console.log(`\n🔐 Setting password for: ${email}`);
    console.log(`   New password: ${password}\n`);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.updateMany({
        where: { email },
        data: {
            password: hashedPassword,
            provider: 'manual'
        }
    });

    console.log('✅ Password updated successfully!');
    console.log(`\n✨ Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
}

setPassword()
    .catch(e => console.error('Error:', e))
    .finally(async () => {
        await prisma.$disconnect();
    });
