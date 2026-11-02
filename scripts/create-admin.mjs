// Creates the first admin account from INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD
// when no admin exists yet. Safe to run on every start.
import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const email = process.env.INITIAL_ADMIN_EMAIL;
const password = process.env.INITIAL_ADMIN_PASSWORD;

if (!email || !password) {
  console.log('[create-admin] INITIAL_ADMIN_EMAIL/PASSWORD not set, skipping');
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const count = await prisma.admin.count();
  if (count === 0) {
    await prisma.admin.create({
      data: { email: email.toLowerCase(), name: 'Admin HausJo', passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' }
    });
    console.log('[create-admin] first admin created:', email);
  }
} finally {
  await prisma.$disconnect();
}
