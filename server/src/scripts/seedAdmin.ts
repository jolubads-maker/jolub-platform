import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@julob.com';
  const password = '123456'; // In production, use strong passwords
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Admin user already exists. Updating role...');
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        // Update password just in case
        password: hashedPassword,
      },
    });
    console.log('Admin user updated.');
  } else {
    console.log('Creating admin user...');
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin JOLUB',
        username: 'admin_jolub',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Admin+JOLUB&background=6e0ad6&color=fff',
        emailVerified: true,
      },
    });
    console.log('Admin user created.');
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
