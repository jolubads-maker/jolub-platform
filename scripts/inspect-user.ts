import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectUser() {
    const email = 'creadorweb505@gmail.com';
    console.log(`Inspecting user(s) with email: ${email}`);

    const users = await prisma.user.findMany({
        where: { email }
    });

    console.log(`Found ${users.length} user(s).`);

    users.forEach((u, i) => {
        console.log(`[User ${i + 1}] ID: ${u.id}, Provider: ${u.provider}, PasswordHash: ${u.password?.substring(0, 20)}...`);
    });

    if (users.length === 0) {
        console.log('No users found. Checking all users...');
        const allUsers = await prisma.user.findMany({ take: 5 });
        allUsers.forEach(u => console.log(`- ${u.email}`));
    }
}

inspectUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
