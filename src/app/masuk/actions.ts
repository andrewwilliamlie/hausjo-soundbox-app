'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { normalisePhone } from '@/lib/rules';
import { endMerchantSession, startMerchantSession } from '@/lib/session';

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const id = String(form.get('id') || '').trim();
  const password = String(form.get('password') || '');
  if (!id || !password) return { error: 'Isi nomor WhatsApp/email dan kata sandi' };
  const user = id.includes('@')
    ? await db.user.findUnique({ where: { email: id.toLowerCase() } })
    : await db.user.findUnique({ where: { phone: normalisePhone(id) } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'Nomor/email atau kata sandi salah' };
  }
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
