// Runs on every start.
// 1. Creates the first admin account from INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD when no admin exists yet.
// 2. Forgotten admin password: if ADMIN_RESET_PASSWORD is set in hPanel, sets it as the new password of the admin
//    with ADMIN_RESET_EMAIL (or INITIAL_ADMIN_EMAIL), re-activates the account and asks for a new password at the next login.
//    Remove ADMIN_RESET_PASSWORD from hPanel afterwards.
import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

const { PrismaClient } = pkg;
const email = process.env.INITIAL_ADMIN_EMAIL;
const password = process.env.INITIAL_ADMIN_PASSWORD;
const resetPassword = process.env.ADMIN_RESET_PASSWORD;
const resetEmail = (process.env.ADMIN_RESET_EMAIL || email || '').toLowerCase().trim();
const mask = (e) => e.replace(/^(.).*(@.*)$/, '$1***$2');

const prisma = new PrismaClient();
try {
  if (email && password && (await prisma.admin.count()) === 0) {
    await prisma.admin.create({
      data: { email: email.toLowerCase(), name: 'Admin HausJo', passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' }
    });
    console.log('[create-admin] first admin created:', mask(email.toLowerCase()));
  } else if (!email || !password) {
    console.log('[create-admin] INITIAL_ADMIN_EMAIL/PASSWORD not set, skipping first admin');
  }

  if (resetPassword) {
    if (resetPassword.length < 10) {
      console.log('[create-admin] ADMIN_RESET_PASSWORD must be at least 10 characters; nothing changed');
    } else if (!resetEmail) {
      console.log('[create-admin] ADMIN_RESET_EMAIL not set; nothing changed');
    } else {
      const admin = await prisma.admin.findUnique({ where: { email: resetEmail } });
      if (!admin) {
        console.log('[create-admin] no admin with', mask(resetEmail), '- nothing changed');
      } else {
        // Applied once per value: a fingerprint in the audit log stops later restarts from resetting again,
        // even after the admin has chosen a new password.
        const mark = 'reset:' + createHash('sha256').update(resetEmail + '|' + resetPassword).digest('hex').slice(0, 24);
        if (await prisma.auditLog.findFirst({ where: { action: 'ADMIN_PASSWORD_RESET', detail: mark } })) {
          console.log('[create-admin] reset password already applied for', mask(resetEmail), '- remove ADMIN_RESET_PASSWORD from hPanel');
        } else {
          await prisma.admin.update({
            where: { id: admin.id },
            data: { passwordHash: await bcrypt.hash(resetPassword, 12), active: true, mustChangePassword: true, passwordChangedAt: new Date() }
          });
          await prisma.auditLog.create({ data: { adminId: admin.id, action: 'ADMIN_PASSWORD_RESET', detail: mark } });
          console.log('[create-admin] password reset for', mask(resetEmail), '- log in, set a new password, then remove ADMIN_RESET_PASSWORD from hPanel');
        }
      }
    }
  }
} finally {
  await prisma.$disconnect();
}
