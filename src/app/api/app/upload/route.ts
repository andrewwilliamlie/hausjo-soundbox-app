import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readKtp } from '@/lib/ocr';
import { merchantId } from '@/lib/auth';
import { MAX_UPLOAD_BYTES, allowedMime, saveUpload } from '@/lib/storage';

const MERCHANT_KINDS = ['KTP', 'SELFIE', 'STORE_FRONT', 'PRODUCT'] as const;
type Kind = (typeof MERCHANT_KINDS)[number];

export async function POST(req: Request) {
  const uid = await merchantId();
  if (!uid) return NextResponse.json({ error: 'Silakan masuk lagi' }, { status: 401 });

  const app = await db.application.findFirst({ where: { userId: uid }, orderBy: { createdAt: 'desc' } });
  if (!app) return NextResponse.json({ error: 'Pendaftaran tidak ditemukan' }, { status: 404 });
  if (!['DRAFT', 'REVISION', 'SUBMITTED'].includes(app.status))
    return NextResponse.json({ error: 'Pendaftaran sudah diproses, foto tidak bisa diganti' }, { status: 409 });

  const form = await req.formData();
  const kind = String(form.get('kind')) as Kind;
  const file = form.get('file');
  if (!MERCHANT_KINDS.includes(kind)) return NextResponse.json({ error: 'Jenis foto tidak dikenal' }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'File kosong' }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'Ukuran foto maksimal 8 MB' }, { status: 413 });
  if (!allowedMime(file.type, false)) return NextResponse.json({ error: 'Gunakan foto JPG, PNG atau WEBP' }, { status: 415 });

  // After submission, only rejected photos may be replaced.
  const existing = await db.document.findFirst({ where: { applicationId: app.id, kind }, orderBy: { createdAt: 'desc' } });
  if (app.status !== 'DRAFT' && existing && existing.decision !== 'REJECTED')
    return NextResponse.json({ error: 'Foto ini sudah diperiksa dan tidak perlu diganti' }, { status: 409 });

  const storagePath = await saveUpload(app.id, kind, file);
  await db.document.deleteMany({ where: { applicationId: app.id, kind } });
  const doc = await db.document.create({
    data: { applicationId: app.id, kind, storagePath, mime: file.type, size: file.size }
  });

  // Re-upload during revision: once nothing is rejected any more, back to the review queue.
  if (app.status === 'REVISION') {
    const stillRejected = await db.document.count({ where: { applicationId: app.id, decision: 'REJECTED' } });
    if (stillRejected === 0) await db.application.update({ where: { id: app.id }, data: { status: 'SUBMITTED', revisionNote: null } });
  }

  let ocr = null;
  if (kind === 'KTP') {
    ocr = await readKtp(Buffer.from(await file.arrayBuffer()), file.type);
    if (ocr) {
      await db.application.update({ where: { id: app.id }, data: { ...ocr.fields, ocrConfidence: ocr.confidence, ocrEdited: false } });
    }
  }

  return NextResponse.json({ ok: true, documentId: doc.id, ocr });
}
