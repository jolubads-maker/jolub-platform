import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function diagnoseAndFix() {
    console.log('\n═══════════════════════════════════════════');
    console.log('🔍 PASSWORD DIAGNOSTIC TOOL');
    console.log('═══════════════════════════════════════════\n');

    const email = 'creadorweb505@gmail.com';
    const testPasswords = ['asdfgh', 'qwerty', '123456'];

    console.log(`📧 Checking user: ${email}\n`);

    const user = await prisma.user.findFirst({
        where: { email },
        select: {
            id: true,
            email: true,
            username: true,
            provider: true,
            password: true
        }
    });

    if (!user) {
        console.log('❌ USER NOT FOUND!\n');
        return;
    }

    console.log('✅ User found in database:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   Provider:', user.provider);
    console.log('   Has password:', !!user.password);

    if (user.password) {
        console.log('   Password hash:', user.password.substring(0, 30) + '...\n');

        console.log('🔐 Testing passwords:\n');

        for (const pwd of testPasswords) {
            const isMatch = await bcrypt.compare(pwd, user.password);
            console.log(`   "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        }

        // Check if any password matches
        const anyMatch = await Promise.all(
            testPasswords.map(pwd => bcrypt.compare(pwd, user.password!))
        );

        if (!anyMatch.some(m => m)) {
            console.log('\n⚠️  NONE OF THE PASSWORDS MATCH!');
            console.log('   Setting password to: asdfgh\n');

            const newHash = await bcrypt.hash('asdfgh', 10);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: newHash,
                    provider: 'manual'
                }
            });

            console.log('✅ Password updated!');
            console.log('   New hash:', newHash.substring(0, 30) + '...');

            // Verify the update
            const updated = await prisma.user.findUnique({
                where: { id: user.id },
                select: { password: true }
            });

            if (updated?.password) {
                const verifyMatch = await bcrypt.compare('asdfgh', updated.password);
                console.log('   Verification:', verifyMatch ? '✅ SUCCESS' : '❌ FAILED');
            }
        }
    } else {
        console.log('\n⚠️  NO PASSWORD IN DATABASE!');
        console.log('   Adding password: asdfgh\n');

        const newHash = await bcrypt.hash('asdfgh', 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: newHash,
                provider: 'manual'
            }
        });

        console.log('✅ Password added!');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✨ READY TO LOGIN:');
    console.log('   Email: creadorweb505@gmail.com');
    console.log('   Password: asdfgh');
    console.log('═══════════════════════════════════════════\n');
}

diagnoseAndFix()
    .catch(e => {
        console.error('\n❌ ERROR:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
