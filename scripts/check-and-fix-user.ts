import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndFixUser() {
    const email = 'arysusali.9@gmail.com';
    const password = '123456';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
        console.log('❌ User not found!');
        return;
    }

    console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        provider: user.provider,
        hasPassword: !!user.password,
        passwordValue: user.password ? 'exists' : 'null'
    });

    if (user.provider !== 'manual') {
        console.log(`⚠️  Provider is "${user.provider}", updating to "manual"...`);

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                provider: 'manual',
                password: hashedPassword,
                providerId: null
            }
        });

        console.log('✅ User updated to manual provider with password');
    } else if (!user.password) {
        console.log('⚠️  No password set, adding password...');

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword
            }
        });

        console.log('✅ Password added');
    } else {
        // Test password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password "${password}" match:`, isMatch);

        if (!isMatch) {
            console.log('⚠️  Password mismatch, resetting...');
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword
                }
            });

            console.log('✅ Password reset to "123456"');
        }
    }
}

checkAndFixUser()
    .catch(e => console.error('Error:', e))
    .finally(async () => {
        await prisma.$disconnect();
    });
