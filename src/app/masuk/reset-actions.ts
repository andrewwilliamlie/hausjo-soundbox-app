'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/passwords';
import { createResetLink } from '@/lib/reset';
import { checkPin, normalisePhone } from '@/lib/rules';
import { startMerchantSession } from '@/lib/session';

export type ForgotState = { error: string | null; sent?: boolean };

export async function requestReset(_prev: ForgotState, form: FormData): Promise<ForgotState> {
  const id = String(form.get('id') || '').trim();
  if (!id) return { error: 'Isi nomor WhatsApp atau email' };
  const user = id.includes('@')
    ? await db.user.findUnique({ where: { email: id.toLowerCase() } })
    : await db.user.findUnique({ where: { phone: normalisePhone(id) } });
  // Same answer whether or not the account exists, so the form cannot be used to check who is registered.
  if (user) await createResetLink(user.id);
  return { error: null, sent: true };
}

export type ResetState = { error: string | null };

export async function resetPassword(_prev: ResetState, form: FormData): Promise<ResetState> {
  const token = String(form.get('t') || '');
  const next = String(form.get('next') || '');
  const again = String(form.get('again') || '');
  const pc = checkPin(next);
  if (!pc.ok) return { error: pc.message };
  if (next !== again) return { error: 'Ulangi PIN dengan angka yang sama' };
  const row = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: 'Link sudah kedaluwarsa atau sudah dipakai. Minta link baru.' };
  }
  const now = new Date();
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(next, 12), passwordChangedAt: new Date(now.getTime() - 2000), failedLogins: 0, lockedUntil: null } }),
    // Every outstanding link for this merchant stops working once one is used.
    db.passwordReset.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } })
  ]);
  await startMerchantSession(row.userId);
  redirect('/app');
}
