import { redirect } from 'next/navigation';
import { db } from './db';
import { adminSession, merchantSession, staleSession } from './session';

/** The logged-in merchant and their (single, v1) application, or redirect to /masuk. */
export async function requireMerchant() {
  const s = await merchantSession();
  if (!s) redirect('/masuk');
  const user = await db.user.findUnique({
    where: { id: s.id },
    include: { applications: { orderBy: { createdAt: 'desc' }, take: 1, include: { documents: true } } }
  });
  if (!user || staleSession(s, user.passwordChangedAt)) redirect('/masuk');
  const application = user.applications[0] ?? null;
  return { user, application };
}

export type Role = 'REVIEWER' | 'ACTIVATION' | 'ADMIN';
export const ROLE_LABEL: Record<Role, string> = { REVIEWER: 'Pemeriksa', ACTIVATION: 'Aktivasi & pengiriman', ADMIN: 'Admin (semua akses)' };

/**
 * The logged-in, active admin. Redirects to login when the session is missing, deactivated or older than the
 * last password change; to /admin/akun while a temporary password must still be changed; to /admin when the role
 * is not allowed. ADMIN may do everything.
 */
export async function requireAdmin(roles?: Role[], opts: { allowMustChange?: boolean } = {}) {
  const s = await adminSession();
  if (!s) redirect('/admin/masuk');
  const admin = await db.admin.findUnique({ where: { id: s.id } });
  if (!admin || !admin.active || staleSession(s, admin.passwordChangedAt)) redirect('/admin/masuk');
  if (admin.mustChangePassword && !opts.allowMustChange) redirect('/admin/akun');
  if (roles && admin.role !== 'ADMIN' && !roles.includes(admin.role)) redirect('/admin');
  return admin;
}

export async function audit(adminIdValue: string | null, action: string, applicationId?: string, detail?: string) {
  await db.auditLog.create({ data: { adminId: adminIdValue, action, applicationId, detail } });
}

/** Merchant id for API routes and actions: null when logged out or the session predates a password change. */
export async function merchantId(): Promise<string | null> {
  const s = await merchantSession();
  if (!s) return null;
  const u = await db.user.findUnique({ where: { id: s.id }, select: { passwordChangedAt: true } });
  return u && !staleSession(s, u.passwordChangedAt) ? s.id : null;
}

/** Admin id for API routes: null unless the admin is active, the session is current and no password change is pending. */
export async function adminId(): Promise<string | null> {
  const s = await adminSession();
  if (!s) return null;
  const a = await db.admin.findUnique({ where: { id: s.id }, select: { active: true, passwordChangedAt: true, mustChangePassword: true } });
  return a && a.active && !a.mustChangePassword && !staleSession(s, a.passwordChangedAt) ? s.id : null;
}
