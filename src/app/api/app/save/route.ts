import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { merchantId } from '@/lib/auth';

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
    lat: z.number().min(-12).max(7),
    lng: z.number().min(94).max(142),
    turnover: z.enum(['UMI', 'UKE', 'UME', 'UBE'])
  })
  .partial();

export async function POST(req: Request) {
  const uid = await merchantId();
  if (!uid) return NextResponse.json({ error: 'Silakan masuk lagi' }, { status: 401 });
  const app = await db.application.findFirst({ where: { userId: uid }, orderBy: { createdAt: 'desc' } });
  if (!app) return NextResponse.json({ error: 'Pendaftaran tidak ditemukan' }, { status: 404 });
  if (app.status !== 'DRAFT') return NextResponse.json({ error: 'Pendaftaran sudah terkirim' }, { status: 409 });

  const parsed = fields.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  const data = { ...parsed.data };
  if (data.businessName) data.businessName = data.businessName.toUpperCase();
  if (app.ocrEdited) data.ocrEdited = true; // once edited, stays flagged for the admin

  await db.application.update({ where: { id: app.id }, data });
  return NextResponse.json({ ok: true });
}
