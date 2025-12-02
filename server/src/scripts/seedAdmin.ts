import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@jolub.com';
  const username = 'admin_jolub';
  const password = '123456'; // In production, use strong passwords
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check by email OR username
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    },
  });

  if (existingUser) {
    console.log(`Admin user found (ID: ${existingUser.id}). Updating credentials...`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email, // Ensure email is correct
        username, // Ensure username is correct
        role: 'ADMIN',
        password: hashedPassword,
        provider: 'manual', // CRITICAL: Required for password login
        emailVerified: true
      },
    });
    console.log('Admin user updated successfully.');
  } else {
    console.log('Creating admin user...');
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin JOLUB',
        username,
        role: 'ADMIN',
        provider: 'manual', // CRITICAL: Required for password login
        avatar: 'https://ui-avatars.com/api/?name=Admin+JOLUB&background=6e0ad6&color=fff',
        emailVerified: true,
      },
    });
    console.log('Admin user created successfully.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
