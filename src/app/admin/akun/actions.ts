'use server';

import bcrypt from 'bcryptjs';
import { audit, requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { MIN_ADMIN_PASSWORD } from '@/lib/passwords';
import { startAdminSession } from '@/lib/session';

export type PwState = { error: string | null; ok?: boolean };

export async function changeOwnPassword(_prev: PwState, form: FormData): Promise<PwState> {
  const me = await requireAdmin(undefined, { allowMustChange: true });
  const current = String(form.get('current') || '');
  const next = String(form.get('next') || '');
  const again = String(form.get('again') || '');
  if (!(await bcrypt.compare(current, me.passwordHash))) return { error: 'Kata sandi saat ini salah' };
  if (next.length < MIN_ADMIN_PASSWORD) return { error: `Kata sandi baru minimal ${MIN_ADMIN_PASSWORD} karakter` };
  if (next !== again) return { error: 'Ulangi kata sandi baru dengan sama persis' };
  if (next === current) return { error: 'Kata sandi baru harus berbeda' };
  await db.admin.update({
    where: { id: me.id },
    data: { passwordHash: await bcrypt.hash(next, 12), mustChangePassword: false, passwordChangedAt: new Date(Date.now() - 2000) }
  });
  // Other devices are signed out (their session predates the change); this one gets a fresh session.
  await startAdminSession(me.id);
  await audit(me.id, 'PASSWORD_CHANGE');
  return { error: null, ok: true };
}
