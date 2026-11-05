'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OUTLET_COOKIE, merchantId } from '@/lib/auth';
import { db } from '@/lib/db';
import { newTicket } from '@/lib/ticket';

const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 };

/** Switch the store the app shows. */
export async function selectOutlet(id: string) {
  const uid = await merchantId();
  if (!uid) redirect('/masuk');
  const own = await db.application.findFirst({ where: { id, userId: uid }, select: { id: true, status: true } });
  if (!own) redirect('/app/toko');
  (await cookies()).set(OUTLET_COOKIE, own.id, cookieOpts);
  redirect(own.status === 'DRAFT' ? '/daftar/langkah' : '/app');
}

/**
 * Add a branch/outlet: a new application for the same owner. The owner's e-KTP data and photos are reused
 * (the team still reviews them for this store), so the merchant only fills in the new store's details.
 */
export async function addOutlet(product: 'SOUNDBOX' | 'QRIS') {
  const uid = await merchantId();
  if (!uid) redirect('/masuk');
  const count = await db.application.count({ where: { userId: uid } });
  if (count >= 20) redirect('/app/toko?penuh=1');
  const src = await db.application.findFirst({ where: { userId: uid, status: { not: 'DRAFT' } }, orderBy: { createdAt: 'asc' }, include: { documents: true } })
    ?? await db.application.findFirst({ where: { userId: uid }, orderBy: { createdAt: 'asc' }, include: { documents: true } });
  let created = null;
  for (let i = 0; i < 5 && !created; i++) {
    try {
      created = await db.application.create({
        data: {
          ticket: newTicket(), userId: uid, product, soundboxStatus: 'NONE',
          ktpName: src?.ktpName, nik: src?.nik, birthPlace: src?.birthPlace, birthDate: src?.birthDate, gender: src?.gender,
          religion: src?.religion, occupation: src?.occupation, ktpAddress: src?.ktpAddress, ocrConfidence: src?.ocrConfidence, ocrEdited: src?.ocrEdited ?? false,
          livenessPassed: src?.livenessPassed, livenessAt: src?.livenessAt, livenessNote: src?.livenessNote,
          documents: {
            create: (src?.documents ?? []).filter((d) => d.kind === 'KTP' || d.kind === 'SELFIE')
              .map((d) => ({ kind: d.kind, storagePath: d.storagePath, mime: d.mime, size: d.size }))
          }
        }
      });
    } catch (e) {
      if (i === 4) throw e; // ticket collision is the only expected error; retry with a new ticket
    }
  }
  (await cookies()).set(OUTLET_COOKIE, created!.id, cookieOpts);
  redirect('/daftar/langkah');
}
