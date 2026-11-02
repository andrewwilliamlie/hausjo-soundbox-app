import { redirect } from 'next/navigation';
import { db } from './db';
import { adminId, merchantId } from './session';

/** The logged-in merchant and their (single, v1) application, or redirect to /masuk. */
export async function requireMerchant() {
  const id = await merchantId();
  if (!id) redirect('/masuk');
  const user = await db.user.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: 'desc' }, take: 1, include: { documents: true } } }
  });
  if (!user) redirect('/masuk');
  const application = user.applications[0] ?? null;
  return { user, application };
}

export async function requireAdmin(roles?: Array<'REVIEWER' | 'ACTIVATION' | 'ADMIN'>) {
  const id = await adminId();
  if (!id) redirect('/admin/masuk');
  const admin = await db.admin.findUnique({ where: { id } });
  if (!admin) redirect('/admin/masuk');
  if (roles && admin.role !== 'ADMIN' && !roles.includes(admin.role)) redirect('/admin');
  return admin;
}

export async function audit(adminIdValue: string | null, action: string, applicationId?: string, detail?: string) {
  await db.auditLog.create({ data: { adminId: adminIdValue, action, applicationId, detail } });
}
