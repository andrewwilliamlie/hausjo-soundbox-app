'use server';

import { revalidatePath } from 'next/cache';
import { audit, requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

/** Marks a callback request as called or done, with an internal note. */
export async function updateHelpRequest(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');
  if (!['OPEN', 'CALLED', 'DONE'].includes(status)) return;
  const r = await db.helpRequest.findUnique({ where: { id } });
  if (!r) return;
  await db.helpRequest.update({ where: { id }, data: { status, adminNote: String(form.get('adminNote') ?? '').trim().slice(0, 500) || null, handledBy: admin.name } });
  await audit(admin.id, 'HELP_' + status, r.applicationId ?? undefined, r.number);
  revalidatePath('/admin/bantuan');
}
