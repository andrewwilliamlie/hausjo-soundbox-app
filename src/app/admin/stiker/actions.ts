'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit, requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { mails, sendMail } from '@/lib/mail';
import { STATUS_LABEL, type StickerStatus } from '@/lib/sticker';

const input = z.object({
  id: z.string().min(1),
  status: z.enum(['UNPAID', 'PAID', 'PRINTING', 'SHIPPED', 'DONE', 'CANCELLED']),
  payMethod: z.string().trim().max(40),
  courier: z.string().trim().max(40),
  trackingNo: z.string().trim().max(60),
  adminNote: z.string().trim().max(300)
});

/** Saves an order's status and shipping details; emails the merchant when the status changes. */
export async function updateStickerOrder(form: FormData) {
  const admin = await requireAdmin(['ACTIVATION']);
  const p = input.safeParse(Object.fromEntries(['id', 'status', 'payMethod', 'courier', 'trackingNo', 'adminNote'].map((k) => [k, String(form.get(k) ?? '')])));
  if (!p.success) return;
  const d = p.data;
  const o = await db.stickerOrder.findUnique({ where: { id: d.id }, include: { user: true } });
  if (!o) return;
  const changed = o.status !== d.status;
  const now = new Date();
  const history = [...((o.history as unknown as object[]) ?? []), ...(changed ? [{ s: d.status, at: now.toISOString(), by: admin.name }] : [])];
  await db.stickerOrder.update({
    where: { id: o.id },
    data: {
      status: d.status as StickerStatus, payMethod: d.payMethod || null, courier: d.courier || null, trackingNo: d.trackingNo || null, adminNote: d.adminNote || null,
      paidAt: d.status === 'PAID' && !o.paidAt ? now : o.paidAt,
      shippedAt: d.status === 'SHIPPED' && !o.shippedAt ? now : o.shippedAt,
      history: history as unknown as Prisma.InputJsonValue
    }
  });
  await audit(admin.id, 'STICKER_' + d.status, o.applicationId, `${o.number}${changed ? '' : ' (detail)'}`);
  if (changed) {
    const extra = d.status === 'SHIPPED' && d.trackingNo ? `Kurir: ${d.courier || '-'}\nNomor resi: ${d.trackingNo}` : '';
    const m = mails.stickerStatus(o.number, STATUS_LABEL[d.status as StickerStatus], extra);
    void sendMail(o.user.email, m.subject, m.text);
  }
  revalidatePath('/admin/stiker');
}
