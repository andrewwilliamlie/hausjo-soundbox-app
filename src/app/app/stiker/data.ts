import { redirect } from 'next/navigation';
import { requireMerchant } from '@/lib/auth';

/** The merchant and the store being viewed, for the sticker screens. */
export async function stickerContext() {
  const { user, application: app, outletCount } = await requireMerchant();
  if (!app) redirect('/daftar');
  if (app.status === 'DRAFT') redirect('/daftar/langkah');
  return { user, app, outletCount, active: app.status === 'ACTIVE' };
}
