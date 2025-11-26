import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
    const email = 'creadorweb505@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        provider: user.provider,
        hasPassword: !!user.password,
    });

    if (user.password) {
        const isMatchAsdfgh = await bcrypt.compare('asdfgh', user.password);
        console.log('Password "asdfgh" match:', isMatchAsdfgh);

        const isMatchQwerty = await bcrypt.compare('qwerty', user.password);
        console.log('Password "qwerty" match:', isMatchQwerty);
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
