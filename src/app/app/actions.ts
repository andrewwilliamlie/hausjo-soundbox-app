'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { merchantId } from '@/lib/auth';

export type Result = { ok: boolean; error?: string; message?: string };

async function myApp() {
  const uid = await merchantId();
  if (!uid) return null;
  return db.application.findFirst({ where: { userId: uid }, orderBy: { createdAt: 'desc' } });
}

const bankSchema = z.object({
  bankName: z.string().trim().min(2, 'Pilih bank'),
  accountNo: z.string().trim().regex(/^\d{6,20}$/, 'Nomor rekening hanya angka (6–20 digit)'),
  accountHolder: z.string().trim().min(3, 'Isi nama pemilik rekening'),
  settlement: z.enum(['H1', 'SAME_DAY'])
});

export async function saveBank(input: z.infer<typeof bankSchema>): Promise<Result> {
  const app = await myApp();
  if (!app) return { ok: false, error: 'Silakan masuk lagi' };
  if (app.status === 'ACTIVE' || app.status === 'BANK') return { ok: false, error: 'Rekening sudah dikirim ke bank. Hubungi CS untuk mengubah.' };
  const p = bankSchema.safeParse({ ...input, accountNo: input.accountNo.replace(/\D/g, '') });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message };
  await db.application.update({ where: { id: app.id }, data: { ...p.data, accountHolder: p.data.accountHolder.toUpperCase() } });
  revalidatePath('/app');
  return { ok: true, message: 'Rekening tersimpan. Data Anda siap dikirim ke bank.' };
}

const sbSchema = z.object({
  way: z.enum(['buy', 'market', 'sales']),
  marketplace: z.string().trim().max(40).optional(),
  orderNo: z.string().trim().max(60).optional(),
  salesName: z.string().trim().max(80).optional()
});

export async function setSoundbox(input: z.infer<typeof sbSchema>): Promise<Result> {
  const app = await myApp();
  if (!app) return { ok: false, error: 'Silakan masuk lagi' };
  const p = sbSchema.safeParse(input);
  if (!p.success) return { ok: false, error: 'Data tidak valid' };
  const d = p.data;
  if (d.way === 'market' && !d.orderNo) return { ok: false, error: 'Isi No. Pesanan' };
  if (d.way === 'sales' && !d.salesName) return { ok: false, error: 'Isi nama sales' };
  await db.application.update({
    where: { id: app.id },
    data: {
      product: 'SOUNDBOX',
      soundboxStatus: d.way === 'buy' ? 'BUY' : d.way === 'market' ? 'MARKETPLACE' : 'SALES',
      marketplace: d.way === 'market' ? d.marketplace : null,
      orderNo: d.way === 'market' ? d.orderNo : null,
      salesName: d.way === 'sales' ? d.salesName : null
    }
  });
  revalidatePath('/app');
  return {
    ok: true,
    message: d.way === 'buy'
      ? 'Pesanan dicatat. Link pembayaran Doku dikirim tim kami setelah QRIS disetujui.'
      : 'Terima kasih. Admin mencocokkan pesanan Anda.'
  };
}

export async function submitSerial(serial: string): Promise<Result> {
  const app = await myApp();
  if (!app) return { ok: false, error: 'Silakan masuk lagi' };
  const sn = serial.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,40}$/.test(sn)) return { ok: false, error: 'SN tidak valid. Periksa stiker di bawah Soundbox.' };
  await db.application.update({
    where: { id: app.id },
    data: { product: 'SOUNDBOX', soundboxStatus: 'ARRIVED', serialNumber: sn, needsGuide: true, guidedAt: null }
  });
  revalidatePath('/app');
  return { ok: true, message: 'SN tercatat. CS HausJo akan menghubungi Anda untuk panduan aktivasi.' };
}

export async function changeMerchantPassword(input: { current: string; next: string; again: string }): Promise<Result> {
  const uid = await merchantId();
  if (!uid) return { ok: false, error: 'Silakan masuk lagi' };
  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  const bcrypt = (await import('bcryptjs')).default;
  if (!(await bcrypt.compare(input.current, user.passwordHash))) return { ok: false, error: 'Kata sandi saat ini salah' };
  if (input.next.length < 8) return { ok: false, error: 'Kata sandi baru minimal 8 karakter' };
  if (input.next !== input.again) return { ok: false, error: 'Ulangi kata sandi baru dengan sama persis' };
  await db.user.update({ where: { id: uid }, data: { passwordHash: await bcrypt.hash(input.next, 12), passwordChangedAt: new Date(Date.now() - 2000) } });
  const { startMerchantSession } = await import('@/lib/session');
  await startMerchantSession(uid); // this phone stays signed in; other devices are signed out
  return { ok: true, message: 'Kata sandi baru tersimpan' };
}
