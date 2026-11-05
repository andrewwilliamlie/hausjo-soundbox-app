import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentOutletId, merchantId } from '@/lib/auth';

// Fields a merchant may set during signup (DRAFT only). Admin-only fields are never accepted here.
const fields = z
  .object({
    ktpName: z.string().trim().max(100),
    nik: z.string().trim().max(16),
    birthPlace: z.string().trim().max(60),
    birthDate: z.string().trim().max(20),
    gender: z.string().trim().max(20),
    ktpAddress: z.string().trim().max(200),
    ocrEdited: z.boolean(),
    hasStore: z.boolean(),
    sellsOffline: z.boolean(),
    sellsOnline: z.boolean(),
    onlineLink: z.string().trim().max(200),
    businessType: z.string().trim().max(60),
    businessName: z.string().trim().max(40),
    street: z.string().trim().max(150),
    number: z.string().trim().max(30),
    rt: z.string().trim().max(5),
    rw: z.string().trim().max(5),
    kelurahan: z.string().trim().max(60),
    kecamatan: z.string().trim().max(60),
    city: z.string().trim().max(60),
    province: z.string().trim().max(60),
    postalCode: z.string().trim().max(10),
    villageCode: z.string().trim().regex(/^(\d{2}\.\d{2}\.\d{2}\.\d{4})?$/),
    lat: z.number().min(-12).max(7).nullable(),
    lng: z.number().min(94).max(142).nullable(),
    turnover: z.enum(['UMI', 'UKE', 'UME', 'UBE']),
    bankName: z.string().trim().min(2).max(40),
    accountNo: z.string().regex(/^\d{6,20}$/),
    accountHolder: z.string().trim().min(3).max(100),
    settlement: z.enum(['H1', 'SAME_DAY']),
    copyBankFrom: z.string().max(40)
  })
  .partial();

export async function POST(req: Request) {
  const uid = await merchantId();
  if (!uid) return NextResponse.json({ error: 'Silakan masuk lagi' }, { status: 401 });
  const outletId = await currentOutletId(uid);
  const app = outletId ? await db.application.findUnique({ where: { id: outletId } }) : null;
  if (!app) return NextResponse.json({ error: 'Pendaftaran tidak ditemukan' }, { status: 404 });
  if (app.status !== 'DRAFT') return NextResponse.json({ error: 'Pendaftaran sudah terkirim' }, { status: 409 });

  const parsed = fields.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  const { copyBankFrom, ...data } = parsed.data;
  // "Pakai rekening yang sama": copy the payout account from another store of the same owner.
  if (copyBankFrom) {
    const src = await db.application.findFirst({ where: { id: copyBankFrom, userId: uid }, select: { bankName: true, accountNo: true, accountHolder: true } });
    if (!src?.accountNo) return NextResponse.json({ error: 'Rekening tidak ditemukan' }, { status: 400 });
    Object.assign(data, { bankName: src.bankName, accountNo: src.accountNo, accountHolder: src.accountHolder });
  }
  if (data.businessName) data.businessName = data.businessName.toUpperCase();
  if (app.ocrEdited) data.ocrEdited = true; // once edited, stays flagged for the admin

  await db.application.update({ where: { id: app.id }, data });
  return NextResponse.json({ ok: true });
}
