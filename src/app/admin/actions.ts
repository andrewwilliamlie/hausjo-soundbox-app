'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { audit, requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { mails, sendMail } from '@/lib/mail';
import { checkBusinessName } from '@/lib/rules';
import { endAdminSession, startAdminSession } from '@/lib/session';
import { MAX_UPLOAD_BYTES, allowedMime, readUpload, saveUpload } from '@/lib/storage';

const DOC_LABEL: Record<string, string> = {
  KTP: 'Foto e-KTP',
  SELFIE: 'Selfie dengan e-KTP',
  STORE_FRONT: 'Foto depan toko',
  PRODUCT: 'Foto produk di toko'
};
const REQUIRED = ['KTP', 'SELFIE', 'STORE_FRONT', 'PRODUCT'];

export async function adminLogin(_prev: { error: string | null }, form: FormData): Promise<{ error: string | null }> {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  const admin = await db.admin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return { error: 'Email atau kata sandi salah' };
  await startAdminSession(admin.id);
  await audit(admin.id, 'LOGIN');
  redirect('/admin');
}

export async function adminLogout() {
  await endAdminSession();
  redirect('/admin/masuk');
}

function back(_id: string) {
  revalidatePath('/admin');
}

export async function decideDoc(form: FormData) {
  const admin = await requireAdmin(['REVIEWER']);
  const docId = String(form.get('docId'));
  const decision = String(form.get('decision'));
  const reason = String(form.get('reason') || '') || null;
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc || !['APPROVED', 'REJECTED', 'PENDING'].includes(decision)) return;
  await db.document.update({
    where: { id: docId },
    data: { decision: decision as 'APPROVED' | 'REJECTED' | 'PENDING', rejectReason: decision === 'REJECTED' ? reason || 'Foto buram' : null }
  });
  await audit(admin.id, 'DOC_' + decision, doc.applicationId, doc.kind);
  back(doc.applicationId);
}

export async function sendRevision(form: FormData) {
  const admin = await requireAdmin(['REVIEWER']);
  const id = String(form.get('id'));
  const app = await db.application.findUnique({ where: { id }, include: { documents: true, user: true } });
  if (!app) return;
  const rejected = app.documents.filter((d) => d.decision === 'REJECTED');
  const nameBad = !checkBusinessName(app.businessName ?? '').ok;
  if (!rejected.length && !nameBad) return;
  const items = rejected.map((d) => `${DOC_LABEL[d.kind] ?? d.kind}: ${d.rejectReason ?? 'perlu diganti'}`);
  if (nameBad) items.push('Nama usaha tidak sesuai aturan bank (maks. 25 karakter, tanpa karakter khusus)');
  await db.application.update({ where: { id }, data: { status: 'REVISION', revisionNote: items.join('\n') } });
  const m = mails.revision(app.ticket, items);
  await sendMail(app.user.email, m.subject, m.text);
  await audit(admin.id, 'REVISION', id, items.join('; '));
  back(id);
}

export async function saveClassification(form: FormData) {
  const admin = await requireAdmin(['REVIEWER', 'ACTIVATION']);
  const id = String(form.get('id'));
  const bank = String(form.get('routedBank') || '');
  await db.application.update({
    where: { id },
    data: {
      mcc: String(form.get('mcc') || '') || null,
      riskCategory: String(form.get('riskCategory') || '') || null,
      qrisType: String(form.get('qrisType') || '') || null,
      turnover: String(form.get('turnover') || 'UMI'),
      routedBank: ['BCA', 'NOBU', 'BAYARIND'].includes(bank) ? (bank as 'BCA' | 'NOBU' | 'BAYARIND') : null
    }
  });
  await audit(admin.id, 'CLASSIFY', id);
  back(id);
}

export async function approve(form: FormData) {
  const admin = await requireAdmin(['REVIEWER']);
  const id = String(form.get('id'));
  const app = await db.application.findUnique({ where: { id }, include: { documents: true } });
  if (!app || !['SUBMITTED', 'REVISION'].includes(app.status)) return;
  const allOk = REQUIRED.every((k) => app.documents.some((d) => d.kind === k && d.decision === 'APPROVED'));
  if (!allOk || !app.accountNo || !app.routedBank || !checkBusinessName(app.businessName ?? '').ok) return;
  await db.application.update({ where: { id }, data: { status: 'BANK' } });
  await audit(admin.id, 'APPROVE', id, app.routedBank);
  back(id);
}

export async function activate(form: FormData) {
  const admin = await requireAdmin(['ACTIVATION']);
  const id = String(form.get('id'));
  const app = await db.application.findUnique({ where: { id }, include: { documents: true, user: true } });
  if (!app || !['BANK', 'ACTIVE'].includes(app.status)) return;

  const mpan = String(form.get('mpan') || '').trim();
  const mid = String(form.get('mid') || '').trim();
  const nmid = String(form.get('nmid') || '').trim().toUpperCase();
  const file = form.get('sticker');

  let stickerPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES || !allowedMime(file.type, true)) return;
    stickerPath = await saveUpload(app.id, 'QRIS_STICKER', file);
    await db.document.deleteMany({ where: { applicationId: id, kind: 'QRIS_STICKER' } });
    await db.document.create({ data: { applicationId: id, kind: 'QRIS_STICKER', storagePath: stickerPath, mime: file.type, size: file.size, decision: 'APPROVED' } });
  }
  const sticker = await db.document.findFirst({ where: { applicationId: id, kind: 'QRIS_STICKER' } });
  await db.application.update({ where: { id }, data: { mpan: mpan || app.mpan, mid: mid || app.mid, nmid: nmid || app.nmid } });

  // Activate only with an NMID and a sticker.
  if ((nmid || app.nmid) && sticker && app.status === 'BANK') {
    await db.application.update({ where: { id }, data: { status: 'ACTIVE', activatedAt: new Date() } });
    const m = mails.active(app.ticket, app.businessName ?? '');
    const content = await readUpload(sticker.storagePath);
    const ext = sticker.mime === 'application/pdf' ? 'pdf' : sticker.mime.split('/')[1];
    await sendMail(app.user.email, m.subject, m.text, [{ filename: `QRIS-${app.businessName}.${ext}`, content, contentType: sticker.mime }]);
    await audit(admin.id, 'ACTIVATE', id, nmid || app.nmid || '');
  } else {
    await audit(admin.id, 'BANK_IDS', id);
  }
  back(id);
}

export async function ship(form: FormData) {
  const admin = await requireAdmin(['ACTIVATION']);
  const id = String(form.get('id'));
  await db.application.update({
    where: { id },
    data: {
      courier: String(form.get('courier') || '') || null,
      trackingNo: String(form.get('trackingNo') || '') || null,
      serialNumber: String(form.get('serialNumber') || '').toUpperCase() || undefined,
      shippedAt: new Date()
    }
  });
  await audit(admin.id, 'SHIP', id);
  back(id);
}

export async function markGuided(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get('id'));
  await db.application.update({ where: { id }, data: { guidedAt: new Date(), needsGuide: false } });
  await audit(admin.id, 'GUIDED', id);
  back(id);
}

export async function markSoundboxPaid(form: FormData) {
  const admin = await requireAdmin(['ACTIVATION']);
  const id = String(form.get('id'));
  await db.application.update({ where: { id }, data: { soundboxPaidAt: new Date() } });
  await audit(admin.id, 'SOUNDBOX_PAID', id);
  back(id);
}
