'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { currentOutletId, merchantId } from '@/lib/auth';
import { CS_EMAIL } from '@/lib/contact';
import { db } from '@/lib/db';
import { CALL_TIMES, topicById } from '@/lib/help';
import { todayISO } from '@/lib/invoice';
import { sendMail } from '@/lib/mail';

export type Res = { ok: true; number: string } | { ok: false; error: string };

const input = z.object({
  topic: z.string().max(40),
  phone: z.string().trim().regex(/^(\+?62|0)8\d{7,12}$/, 'Nomor HP belum benar (contoh 0812…)'),
  callTime: z.string(),
  note: z.string().trim().max(500).optional(),
  triedSteps: z.number().int().min(0).max(20)
});

/** "Minta CS menelepon saya": saves a callback request and emails CS. */
export async function requestCall(raw: unknown): Promise<Res> {
  const uid = await merchantId();
  if (!uid) return { ok: false, error: 'Silakan masuk lagi' };
  const p = input.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Data belum lengkap' };
  const d = p.data;
  const topic = topicById(d.topic);
  if (!topic) return { ok: false, error: 'Topik tidak ditemukan' };
  const callTime = CALL_TIMES.includes(d.callTime) ? d.callTime : CALL_TIMES[0];
  // One open request per topic is enough; a second tap returns the same one.
  const open = await db.helpRequest.findFirst({ where: { userId: uid, topic: topic.id, status: 'OPEN', createdAt: { gt: new Date(Date.now() - 6 * 3600_000) } } });
  if (open) return { ok: true, number: open.number };

  const outletId = await currentOutletId(uid);
  const store = outletId ? await db.application.findUnique({ where: { id: outletId }, select: { id: true, businessName: true, ticket: true, nmid: true } }) : null;
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const number = `BNT-${todayISO().slice(2).replace(/-/g, '')}-${[...randomBytes(4)].map((b) => abc[b % abc.length]).join('')}`;
  await db.helpRequest.create({
    data: { number, userId: uid, applicationId: store?.id ?? null, topic: topic.id, phone: d.phone, callTime, note: d.note || null, triedSteps: d.triedSteps }
  });
  void sendMail(process.env.HELP_NOTIFY_EMAIL || CS_EMAIL, `Minta ditelepon · ${topic.title} · ${number}`,
    `${store?.businessName ?? '-'} (${store?.ticket ?? '-'}, NMID ${store?.nmid ?? '-'})\nTopik: ${topic.title}\nTelepon: ${d.phone} · ${callTime}\nLangkah panduan dicoba: ${d.triedSteps}/${topic.steps.length}\nCatatan: ${d.note || '-'}\n\nKelola di ${process.env.APP_URL || 'https://app.aipos.co.id'}/admin/bantuan`);
  revalidatePath('/app/bantuan');
  return { ok: true, number };
}
