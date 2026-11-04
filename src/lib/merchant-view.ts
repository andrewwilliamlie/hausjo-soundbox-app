import { redirect } from 'next/navigation';
import { requireMerchant } from './auth';

const DOC_LABEL: Record<string, string> = {
  KTP: 'Foto e-KTP',
  SELFIE: 'Selfie dengan e-KTP',
  STORE_FRONT: 'Foto depan toko',
  PRODUCT: 'Foto produk di toko'
};

export type AppView = {
  ticket: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVISION' | 'BANK' | 'ACTIVE' | 'REJECTED';
  product: 'SOUNDBOX' | 'QRIS';
  soundboxStatus: 'NONE' | 'BUY' | 'MARKETPLACE' | 'SALES' | 'ARRIVED';
  bankSet: boolean;
  bankName: string;
  bankLabel: string;
  accountHolder: string;
  settlement: 'H1' | 'SAME_DAY';
  holderDefault: string;
  stickerId: string | null;
  stickerIsImage: boolean;
  serialNumber: string | null;
  needsGuide: boolean;
  rejected: Array<{ kind: string; label: string; reason: string }>;
  nmid: string | null;
  mid: string | null;
  businessName: string;
  ownerFirstName: string;
  ownerName: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  courier: string | null;
  trackingNo: string | null;
};

/** Everything the merchant app screens show, for the logged-in merchant. Redirects when signup is not finished. */
export async function loadMerchantView(): Promise<AppView> {
  const { user, application: app } = await requireMerchant();
  if (!app) redirect('/daftar');
  if (app.status === 'DRAFT') redirect('/daftar/langkah');
  const sticker = app.documents.find((d) => d.kind === 'QRIS_STICKER');
  const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const city = (app.city ?? '').replace(/^(Kota|Kabupaten)( Administrasi)? /i, '');
  return {
    ticket: app.ticket,
    status: app.status,
    product: app.product,
    soundboxStatus: app.soundboxStatus,
    bankSet: !!app.accountNo,
    bankName: app.bankName ?? '',
    bankLabel: app.accountNo ? `${app.bankName} ••••${app.accountNo.slice(-4)}` : '',
    accountHolder: app.accountHolder ?? '',
    settlement: app.settlement,
    holderDefault: app.ktpName ?? '',
    stickerId: sticker?.id ?? null,
    stickerIsImage: !!sticker && sticker.mime.startsWith('image/'),
    serialNumber: app.serialNumber,
    needsGuide: app.needsGuide && !app.guidedAt,
    rejected: app.documents
      .filter((d) => d.decision === 'REJECTED' && d.kind in DOC_LABEL)
      .map((d) => ({ kind: d.kind, label: DOC_LABEL[d.kind], reason: d.rejectReason ?? 'Perlu diganti' })),
    nmid: app.nmid,
    mid: app.mid,
    businessName: app.businessName ?? 'Toko Anda',
    ownerFirstName: title((app.ktpName ?? '').split(' ')[0] || 'Merchant'),
    ownerName: app.ktpName ?? '',
    area: title(app.kecamatan || city || ''),
    address: [app.street, app.number, app.kelurahan, app.kecamatan, app.city, app.province].filter(Boolean).join(', '),
    phone: user.phone,
    email: user.email,
    courier: app.courier,
    trackingNo: app.trackingNo
  };
}
