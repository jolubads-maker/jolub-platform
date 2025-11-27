import bcrypt from 'bcryptjs';

const password = 'dinero2025';
// Hash from previous step output
const dbHash = '$2b$10$dDeJU3tiXS6VfR.u7/7.O.S.v.s.o.m.e.h.a.s.h'; // Placeholder, I need to grab the real one if possible, but since I can't see the full output in the truncated log, I will just generate a new one and update again to be 100% sure.

// Actually, better approach: Just update it again with a known hash and print it.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function forceUpdate() {
    console.log('Forcing password update for creadorweb505@gmail.com');
    const newHash = await bcrypt.hash(password, 10);
    console.log(`New Hash Generated: ${newHash}`);

    await prisma.user.updateMany({
        where: { email: 'creadorweb505@gmail.com' },
        data: { password: newHash }
    });

    // Verify immediately
    const user = await prisma.user.findFirst({ where: { email: 'creadorweb505@gmail.com' } });
    console.log(`Hash in DB after update: ${user?.password}`);

    const match = await bcrypt.compare(password, user?.password || '');
    console.log(`Immediate verification match: ${match}`);
}

forceUpdate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
