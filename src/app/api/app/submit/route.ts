import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mails, sendMail } from '@/lib/mail';
import { checkBusinessName, checkNik } from '@/lib/rules';
import { merchantId } from '@/lib/session';

export async function POST() {
  const uid = await merchantId();
  if (!uid) return NextResponse.json({ error: 'Silakan masuk lagi' }, { status: 401 });
  const app = await db.application.findFirst({
    where: { userId: uid },
    orderBy: { createdAt: 'desc' },
    include: { documents: true, user: true }
  });
  if (!app) return NextResponse.json({ error: 'Pendaftaran tidak ditemukan' }, { status: 404 });
  if (app.status !== 'DRAFT') return NextResponse.json({ ok: true });

  const missing: string[] = [];
  const has = (k: string) => app.documents.some((d) => d.kind === k);
  if (!has('KTP')) missing.push('foto e-KTP');
  if (!has('SELFIE')) missing.push('selfie dengan e-KTP');
  if (!has('STORE_FRONT')) missing.push('foto depan toko');
  if (!has('PRODUCT')) missing.push('foto produk di toko');
  if (!app.ktpName) missing.push('nama sesuai e-KTP');
  if (!checkNik(app.nik ?? '').ok) missing.push('NIK 16 digit');
  if (!checkBusinessName(app.businessName ?? '').ok) missing.push('nama usaha yang sesuai aturan');
  if (!app.businessType) missing.push('jenis usaha');
  if (!app.street || !app.kelurahan || !app.kecamatan || !app.city || !app.province) missing.push('alamat toko lengkap');
  if (missing.length) return NextResponse.json({ error: 'Belum lengkap: ' + missing.join(', ') }, { status: 400 });

  await db.application.update({ where: { id: app.id }, data: { status: 'SUBMITTED', submittedAt: new Date() } });
  const m = mails.submitted(app.ticket);
  await sendMail(app.user.email, m.subject, m.text);
  return NextResponse.json({ ok: true, ticket: app.ticket });
}
