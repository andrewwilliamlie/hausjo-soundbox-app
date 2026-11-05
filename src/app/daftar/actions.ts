'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { checkPin, isValidPhone, normalisePhone } from '@/lib/rules';
import { startMerchantSession } from '@/lib/session';
import { newTicket } from '@/lib/ticket';

export type FormState = { error: string | null };

const schema = z.object({
  phone: z.string().refine(isValidPhone, 'Nomor WhatsApp tidak valid (contoh: 0812 3456 7890)'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  pin: z.string().regex(/^\d{6}$/, 'PIN harus 6 angka'),
  pin2: z.string().optional(),
  referral: z.string().trim().max(40).optional(),
  product: z.enum(['soundbox', 'qris']),
});

export async function createAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data belum lengkap' };
  const d = parsed.data;
  const pc = checkPin(d.pin);
  if (!pc.ok) return { error: pc.message };
  if (d.pin2 !== d.pin) return { error: 'Ulangi PIN dengan angka yang sama' };

  const phone = normalisePhone(d.phone);
  const exists = await db.user.findFirst({ where: { OR: [{ phone }, { email: d.email }] } });
  if (exists) return { error: 'Nomor WhatsApp atau email sudah terdaftar. Silakan masuk.' };

  const user = await db.user.create({
    data: { phone, email: d.email, passwordHash: await bcrypt.hash(d.pin, 12), referralCode: d.referral || null }
  });

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.application.create({
        data: {
          ticket: newTicket(),
          userId: user.id,
          product: d.product === 'soundbox' ? 'SOUNDBOX' : 'QRIS',
          // How the Soundbox is obtained is chosen once, inside the app
          soundboxStatus: 'NONE'
        }
      });
      break;
    } catch (e) {
      if (attempt === 4) throw e; // ticket collision is extremely unlikely; retry a few times
    }
  }

  await startMerchantSession(user.id);
  redirect('/daftar/langkah');
}
