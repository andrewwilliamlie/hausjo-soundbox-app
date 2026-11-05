'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { normalisePhone } from '@/lib/rules';
import { endMerchantSession, startMerchantSession } from '@/lib/session';

export type LoginState = { error: string | null };

const MAX_FAILS = 5;

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const id = String(form.get('id') || '').trim();
  // "pin" from the PIN boxes; "password" from the old-password field for accounts made before PINs.
  const secret = String(form.get('pin') || form.get('password') || '');
  if (!id || !secret) return { error: 'Isi nomor WhatsApp/email dan PIN' };
  const user = id.includes('@')
    ? await db.user.findUnique({ where: { email: id.toLowerCase() } })
    : await db.user.findUnique({ where: { phone: normalisePhone(id) } });
  if (!user) return { error: 'Nomor/email atau PIN salah' };
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    const at = user.lockedUntil.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
    return { error: `Terlalu banyak PIN salah. Coba lagi pukul ${at} WIB, atau pilih "Lupa PIN".` };
  }
  if (!(await bcrypt.compare(secret, user.passwordHash))) {
    // A 6-digit PIN is guessable, so 5 wrong tries in a row lock the account for 15 minutes.
    const fails = user.failedLogins + 1;
    const lock = fails >= MAX_FAILS;
    await db.user.update({ where: { id: user.id }, data: { failedLogins: lock ? 0 : fails, lockedUntil: lock ? new Date(now.getTime() + 15 * 60_000) : null } });
    return { error: lock ? 'PIN salah 5 kali. Akun dikunci 15 menit. Pilih "Lupa PIN" untuk membuat PIN baru.' : `Nomor/email atau PIN salah. Sisa ${MAX_FAILS - fails} percobaan.` };
  }
  if (user.failedLogins || user.lockedUntil) await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await startMerchantSession(user.id);
  // Remember the store name on this phone so the welcome screen can greet it next time.
  const app = await db.application.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: { businessName: true } });
  if (app?.businessName) {
    (await cookies()).set('hj_last', app.businessName.slice(0, 40), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  redirect('/app');
}

export async function logout() {
  await endMerchantSession();
  redirect('/');
}
