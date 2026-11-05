'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { merchantId } from '@/lib/auth';
import { db } from '@/lib/db';
import { FLOW, PAY_METHODS, codeFromName, todayISO, totals, type Status } from '@/lib/invoice';

export type Res<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

const item = z.object({
  productId: z.string().max(40).nullish(),
  name: z.string().trim().min(1, 'Nama barang wajib diisi').max(80),
  price: z.number().int().min(0).max(1_000_000_000),
  qty: z.number().int().min(1).max(10_000),
  note: z.string().trim().max(120).optional()
});
const input = z.object({
  customerName: z.string().trim().min(1, 'Isi nama pelanggan').max(80),
  customerPhone: z.string().trim().max(20),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  note: z.string().trim().max(300),
  items: z.array(item).min(1, 'Tambahkan minimal 1 barang').max(100),
  deliveryType: z.enum(['ambil', 'kirim']),
  deliveryAddress: z.string().trim().max(300),
  deliveryFee: z.number().int().min(0).max(100_000_000),
  discountType: z.enum(['rp', 'pct']),
  discountValue: z.number().int().min(0).max(1_000_000_000),
  taxPct: z.number().min(0).max(100)
});

async function me() {
  const id = await merchantId();
  if (!id) return null;
  return db.user.findUnique({ where: { id }, include: { applications: { orderBy: { createdAt: 'desc' }, take: 1 } } });
}

async function nextNumber(userId: string, code: string) {
  const prefix = `INV-${code}-${todayISO().slice(2).replace(/-/g, '')}-`;
  const last = await db.invoice.findMany({ where: { userId, number: { startsWith: prefix } }, select: { number: true } });
  const max = last.reduce((m, r) => Math.max(m, parseInt(r.number.slice(prefix.length), 10) || 0), 0);
  return prefix + String(max + 1).padStart(3, '0');
}

export async function saveInvoice(raw: unknown, editId?: string): Promise<Res<string>> {
  const user = await me();
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  const p = input.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Data belum lengkap' };
  const d = p.data;
  if (d.deliveryType === 'kirim' && !d.deliveryAddress) return { ok: false, error: 'Isi alamat pengiriman' };
  const t = totals(d);
  const data = {
    customerName: d.customerName, customerPhone: d.customerPhone || null, orderDate: d.orderDate, note: d.note || null,
    items: d.items as unknown as Prisma.InputJsonValue, deliveryType: d.deliveryType,
    deliveryAddress: d.deliveryType === 'kirim' ? d.deliveryAddress : null, deliveryFee: t.fee,
    discountType: d.discountType, discountValue: d.discountValue, taxPct: d.taxPct,
    subtotal: t.subtotal, discount: t.discount, tax: t.tax, total: t.total
  };

  if (editId) {
    const inv = await db.invoice.findFirst({ where: { id: editId, userId: user.id } });
    if (!inv) return { ok: false, error: 'Invoice tidak ditemukan' };
    if (inv.status === 'CANCELLED') return { ok: false, error: 'Invoice yang dibatalkan tidak bisa diubah' };
    await db.invoice.update({ where: { id: inv.id }, data });
    revalidatePath('/app/invoice');
    return { ok: true, data: inv.id };
  }

  const code = user.invoiceCode || codeFromName(user.applications[0]?.businessName ?? '');
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const inv = await db.invoice.create({
        data: { ...data, userId: user.id, number: await nextNumber(user.id, code), status: 'UNPAID', history: [{ s: 'UNPAID', at: new Date().toISOString() }] }
      });
      revalidatePath('/app/invoice');
      return { ok: true, data: inv.id };
    } catch (e) {
      // Two invoices made at the same moment can race for a number; try the next one.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
  }
  return { ok: false, error: 'Gagal membuat nomor invoice. Coba lagi.' };
}

export async function setStatus(id: string, status: Status, payMethod?: string): Promise<Res> {
  const user = await me();
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  const inv = await db.invoice.findFirst({ where: { id, userId: user.id } });
  if (!inv) return { ok: false, error: 'Invoice tidak ditemukan' };
  const from = inv.status as Status;
  if (from === 'CANCELLED' || from === 'DONE') return { ok: false, error: 'Status invoice ini sudah final' };
  if (status === 'CANCELLED') {
    if (!['UNPAID', 'PAID'].includes(from)) return { ok: false, error: 'Invoice yang sudah dikirim tidak bisa dibatalkan' };
  } else if (FLOW.indexOf(status) !== FLOW.indexOf(from) + 1) return { ok: false, error: 'Urutan status tidak sesuai' };
  if (status === 'PAID' && !PAY_METHODS.includes(payMethod ?? '')) return { ok: false, error: 'Pilih metode pembayaran' };
  const history = [...((inv.history as unknown as Array<Record<string, string>>) ?? []), { s: status, at: new Date().toISOString(), ...(status === 'PAID' ? { m: payMethod! } : {}) }];
  await db.invoice.update({
    where: { id },
    data: { status, history, ...(status === 'PAID' ? { payMethod, paidAt: new Date() } : {}) }
  });
  revalidatePath('/app/invoice');
  revalidatePath(`/app/invoice/${id}`);
  return { ok: true };
}

export async function deleteInvoice(id: string): Promise<Res> {
  const user = await me();
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  const inv = await db.invoice.findFirst({ where: { id, userId: user.id } });
  if (!inv) return { ok: false, error: 'Invoice tidak ditemukan' };
  if (inv.status !== 'CANCELLED') return { ok: false, error: 'Batalkan invoice dulu sebelum menghapus' };
  await db.invoice.delete({ where: { id } });
  revalidatePath('/app/invoice');
  return { ok: true };
}

const product = z.object({ name: z.string().trim().min(1, 'Isi nama produk').max(80), price: z.number().int().min(0).max(1_000_000_000) });

export async function saveProduct(raw: unknown, id?: string): Promise<Res<{ id: string; name: string; price: number }>> {
  const user = await me();
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  const p = product.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? 'Data tidak valid' };
  if (id) {
    const own = await db.invoiceProduct.findFirst({ where: { id, userId: user.id } });
    if (!own) return { ok: false, error: 'Produk tidak ditemukan' };
    const up = await db.invoiceProduct.update({ where: { id }, data: p.data });
    revalidatePath('/app/invoice/produk');
    return { ok: true, data: { id: up.id, name: up.name, price: up.price } };
  }
  if ((await db.invoiceProduct.count({ where: { userId: user.id } })) >= 500) return { ok: false, error: 'Maksimal 500 produk' };
  const cr = await db.invoiceProduct.create({ data: { ...p.data, userId: user.id } });
  revalidatePath('/app/invoice/produk');
  return { ok: true, data: { id: cr.id, name: cr.name, price: cr.price } };
}

export async function deleteProduct(id: string): Promise<Res> {
  const user = await me();
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  await db.invoiceProduct.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/app/invoice/produk');
  return { ok: true };
}

export async function saveInvoiceCode(code: string): Promise<Res> {
  const user = await me();
  if (!user) return { ok: false, error: 'Silakan masuk lagi' };
  const c = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,6}$/.test(c)) return { ok: false, error: 'Kode 2–6 huruf atau angka' };
  await db.user.update({ where: { id: user.id }, data: { invoiceCode: c } });
  revalidatePath('/app/invoice');
  return { ok: true, message: 'Kode invoice tersimpan' };
}
