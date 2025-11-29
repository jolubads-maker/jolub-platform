import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const email = 'creadorweb505@gmail.com';
    const newPassword = 'qwerty';
    console.log(`🔍 Searching for user: ${email}`);
    const user = await prisma.user.findFirst({
        where: { email }
    });
    if (!user) {
        console.error('❌ User not found!');
        return;
    }
    console.log(`👤 User found: ${user.id} (${user.name})`);
    console.log(`🔑 Updating password to: ${newPassword}`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            provider: 'manual' // Ensure provider is manual so password login works
        }
    });
    console.log('✅ Password updated successfully!');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
