'use server';

import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { currentOutletId, merchantId } from '@/lib/auth';
import { CS_EMAIL } from '@/lib/contact';
import { db } from '@/lib/db';
import { mails, sendMail } from '@/lib/mail';
import { KIND_NAME, KIND_PATH, KIND_PREFIX, TIME_SLOTS, itemsText, priceOrder, rp } from '@/lib/sticker';
import { todayISO } from '@/lib/invoice';

export type Res<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const address = z.object({
  label: z.string().trim().min(1, 'Isi label alamat').max(30),
  recipient: z.string().trim().min(2, 'Isi nama penerima').max(60),
  phone: z.string().trim().regex(/^(\+?62|0)8\d{7,12}$/, 'Nomor HP penerima belum benar (contoh 0812…)'),
  address: z.string().trim().min(8, 'Lengkapi alamat: nama jalan, gedung, nomor').max(250),
  province: z.string().trim().min(1, 'Pilih provinsi'),
  city: z.string().trim().min(1, 'Pilih kota/kabupaten'),
  kecamatan: z.string().trim().min(1, 'Pilih kecamatan'),
  kelurahan: z.string().trim().min(1, 'Pilih kelurahan/desa'),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Kode pos belum terisi'),
  villageCode: z.string().trim().max(20).optional(),
  courierNote: z.string().trim().max(120).optional()
});
export type AddressInput = z.infer<typeof address>;
export type SavedAddress = AddressInput & { id: string };

export async function saveAddress(raw: unknown, id?: string): Promise<Res<SavedAddress>> {
  const uid = await merchantId();
  if (!uid) return { ok: false, error: 'Silakan masuk lagi' };
  const p = address.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Alamat belum lengkap' };
  const data = { ...p.data, villageCode: p.data.villageCode || null, courierNote: p.data.courierNote || null };
  let row;
  if (id) {
    const own = await db.shipAddress.findFirst({ where: { id, userId: uid } });
    if (!own) return { ok: false, error: 'Alamat tidak ditemukan' };
    row = await db.shipAddress.update({ where: { id }, data });
  } else {
    if ((await db.shipAddress.count({ where: { userId: uid } })) >= 10) return { ok: false, error: 'Maksimal 10 alamat. Hapus salah satu dulu.' };
    row = await db.shipAddress.create({ data: { ...data, userId: uid } });
  }
  return { ok: true, data: { ...row, villageCode: row.villageCode ?? '', courierNote: row.courierNote ?? '' } };
}

export async function deleteAddress(id: string): Promise<Res> {
  const uid = await merchantId();
  if (!uid) return { ok: false, error: 'Silakan masuk lagi' };
  await db.shipAddress.deleteMany({ where: { id, userId: uid } });
  return { ok: true };
}

const order = z.object({
  kind: z.enum(['STIKER', 'EDC']).default('STIKER'),
  qty: z.record(z.string(), z.number().int().min(0).max(100)),
  addressId: z.string().min(1, 'Pilih alamat pengiriman'),
  timeSlot: z.string().optional()
});

const code = () => {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return [...randomBytes(4)].map((b) => abc[b % abc.length]).join('');
};

export async function placeOrder(raw: unknown): Promise<Res<string>> {
  const uid = await merchantId();
  if (!uid) return { ok: false, error: 'Silakan masuk lagi' };
  const p = order.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Pesanan belum lengkap' };
  const outletId = await currentOutletId(uid);
  const store = outletId ? await db.application.findUnique({ where: { id: outletId }, include: { user: true } }) : null;
  const kind = p.data.kind;
  if (!store || store.status === 'DRAFT') return { ok: false, error: 'Selesaikan pendaftaran toko dulu' };
  // A sticker carries the store's QRIS, so it needs an active QRIS; an EDC can be bought any time after signup.
  if (kind === 'STIKER' && store.status !== 'ACTIVE') return { ok: false, error: 'Stiker bisa dipesan setelah QRIS toko ini aktif' };
  if (store.status === 'REJECTED') return { ok: false, error: 'Pendaftaran toko ini ditolak. Hubungi CS AIPOS.' };
  const addr = await db.shipAddress.findFirst({ where: { id: p.data.addressId, userId: uid } });
  if (!addr) return { ok: false, error: 'Pilih alamat pengiriman' };
  const t = priceOrder(p.data.qty, kind);
  if (!t.items.length) return { ok: false, error: kind === 'EDC' ? 'Pilih minimal 1 mesin EDC' : 'Pilih minimal 1 paket' };
  // One open (unpaid) order per store at a time, so a double tap doesn't create two.
  const open = await db.stickerOrder.findFirst({ where: { userId: uid, applicationId: store.id, kind, status: 'UNPAID', createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (open) return { ok: true, data: open.id };

  const timeSlot = p.data.timeSlot && TIME_SLOTS.includes(p.data.timeSlot) ? p.data.timeSlot : null;
  const prefix = `${KIND_PREFIX[kind]}-${todayISO().slice(2).replace(/-/g, '')}-`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const o = await db.stickerOrder.create({
        data: {
          kind, number: prefix + code(), userId: uid, applicationId: store.id,
          items: t.items as unknown as Prisma.InputJsonValue,
          label: addr.label, recipient: addr.recipient, phone: addr.phone, address: addr.address,
          kelurahan: addr.kelurahan, kecamatan: addr.kecamatan, city: addr.city, province: addr.province, postalCode: addr.postalCode,
          courierNote: addr.courierNote, timeSlot,
          subtotal: t.subtotal, normalTotal: t.normalTotal, shippingFee: t.shippingFee, total: t.total,
          history: [{ s: 'UNPAID', at: new Date().toISOString() }]
        }
      });
      const m = mails.stickerOrdered(o.number, store.businessName ?? '', itemsText(t.items), rp(t.total), kind);
      void sendMail(store.user.email, m.subject, m.text);
      void sendMail(process.env.ORDER_NOTIFY_EMAIL || CS_EMAIL, `Pesanan ${KIND_NAME[kind]} baru · ${o.number}`,
        `${store.businessName} (${store.ticket}, NMID ${store.nmid ?? 'belum ada'})\n${itemsText(t.items)}\nTotal ${rp(t.total)}\n\nKirim ke: ${addr.recipient} · ${addr.phone}\n${addr.address}, ${addr.kelurahan}, ${addr.kecamatan}, ${addr.city}, ${addr.province} ${addr.postalCode}\n\nKelola di ${process.env.APP_URL || 'https://app.aipos.co.id'}/admin/stiker`);
      revalidatePath(KIND_PATH[kind]);
      return { ok: true, data: o.id };
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
  }
  return { ok: false, error: 'Gagal membuat pesanan. Coba lagi.' };
}

export async function cancelOrder(id: string): Promise<Res> {
  const uid = await merchantId();
  if (!uid) return { ok: false, error: 'Silakan masuk lagi' };
  const o = await db.stickerOrder.findFirst({ where: { id, userId: uid } });
  if (!o) return { ok: false, error: 'Pesanan tidak ditemukan' };
  if (o.status !== 'UNPAID') return { ok: false, error: 'Pesanan yang sudah dibayar tidak bisa dibatalkan di aplikasi. Hubungi CS.' };
  const history = [...((o.history as unknown as object[]) ?? []), { s: 'CANCELLED', at: new Date().toISOString(), by: 'Merchant' }];
  await db.stickerOrder.update({ where: { id }, data: { status: 'CANCELLED', history: history as unknown as Prisma.InputJsonValue } });
  revalidatePath(KIND_PATH[o.kind === 'EDC' ? 'EDC' : 'STIKER']);
  return { ok: true };
}
