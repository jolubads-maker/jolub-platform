import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPassword() {
    const email = 'creadorweb505@gmail.com';
    const password = 'asdfgh'; // The password the user is trying to use

    console.log(`\n🔍 Checking user: ${email}\n`);

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
        console.log('❌ User not found!');
        return;
    }

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Provider:', user.provider);
    console.log('   Has password:', !!user.password);

    if (user.password) {
        console.log('   Password hash (first 20 chars):', user.password.substring(0, 20) + '...');

        // Test the password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`\n🔐 Testing password "${password}":`, isMatch ? '✅ MATCH' : '❌ NO MATCH');

        if (!isMatch) {
            console.log('\n⚠️  Password mismatch detected. Resetting password...\n');

            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('New hash (first 20 chars):', hashedPassword.substring(0, 20) + '...');

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    provider: 'manual'
                }
            });

            console.log('✅ Password updated successfully!');
            console.log(`\n✨ You can now login with:`);
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
        } else {
            console.log('\n✅ Password is correct! Login should work.');
        }
    } else {
        console.log('\n⚠️  No password set. Adding password...\n');

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                provider: 'manual'
            }
        });

        console.log('✅ Password added successfully!');
    }
}

fixPassword()
    .catch(e => {
        console.error('\n❌ Error:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
