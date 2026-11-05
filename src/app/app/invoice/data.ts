import { redirect } from 'next/navigation';
import { requireMerchant } from '@/lib/auth';
import { codeFromName } from '@/lib/invoice';

export type Shop = {
  name: string; phone: string; address: string; code: string; codeIsDefault: boolean;
  stickerId: string | null; stickerIsImage: boolean; nmid: string | null; qrisActive: boolean;
};

/** The logged-in merchant and the store details printed on invoices. */
export async function invoiceContext() {
  const { user, application: app } = await requireMerchant();
  if (!app) redirect('/daftar');
  if (app.status === 'DRAFT') redirect('/daftar/langkah');
  const sticker = app.documents.find((d) => d.kind === 'QRIS_STICKER');
  const shop: Shop = {
    name: app.businessName ?? 'Toko',
    phone: user.phone,
    address: [app.street, app.number, app.kelurahan, app.kecamatan, app.city].filter(Boolean).join(', '),
    code: user.invoiceCode || codeFromName(app.businessName ?? ''),
    codeIsDefault: !user.invoiceCode,
    stickerId: sticker?.id ?? null,
    stickerIsImage: !!sticker && sticker.mime.startsWith('image/'),
    nmid: app.nmid,
    qrisActive: app.status === 'ACTIVE' && !!sticker
  };
  return { userId: user.id, shop };
}
