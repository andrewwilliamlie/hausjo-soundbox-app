import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireMerchant } from '@/lib/auth';
import { logout } from '../masuk/actions';
import HomeClient from './HomeClient';

export const metadata = { title: 'Aplikasi HausJo' };
export const dynamic = 'force-dynamic';

const DOC_LABEL: Record<string, string> = {
  KTP: 'Foto e-KTP',
  SELFIE: 'Selfie dengan e-KTP',
  STORE_FRONT: 'Foto depan toko',
  PRODUCT: 'Foto produk di toko'
};

export default async function AppHome({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  const { user, application: app } = await requireMerchant();
  if (!app) redirect('/daftar');
  if (app.status === 'DRAFT') redirect('/daftar/langkah');
  const { baru } = await searchParams;

  const sticker = app.documents.find((d) => d.kind === 'QRIS_STICKER');
  const rejected = app.documents
    .filter((d) => d.decision === 'REJECTED' && d.kind in DOC_LABEL)
    .map((d) => ({ kind: d.kind, label: DOC_LABEL[d.kind], reason: d.rejectReason ?? 'Perlu diganti' }));

  return (
    <div className="shell">
      <header style={{ background: 'var(--navy)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: '#bfd4ff' }}>Halo, {(app.ktpName ?? '').split(' ')[0] || 'Merchant'}</span>
          <span style={{ fontSize: 17, fontWeight: 800 }}>{app.businessName}</span>
        </div>
        <form action={logout}><button type="submit" style={{ background: 'none', border: 0, color: '#bfd4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>Keluar</button></form>
      </header>
      <HomeClient
        isNew={baru === '1'}
        app={{
          ticket: app.ticket,
          status: app.status,
          product: app.product,
          soundboxStatus: app.soundboxStatus,
          bankSet: !!app.accountNo,
          bankLabel: app.accountNo ? `${app.bankName} ••••${app.accountNo.slice(-4)}` : '',
          settlement: app.settlement,
          holderDefault: app.ktpName ?? '',
          stickerId: sticker?.id ?? null,
          serialNumber: app.serialNumber,
          needsGuide: app.needsGuide && !app.guidedAt,
          rejected,
          nmid: app.nmid
        }}
      />
      <p className="hint" style={{ textAlign: 'center', padding: '0 20px 20px' }}>
        Masuk sebagai {user.email} · <Link href="/">hausjo.co.id</Link>
      </p>
    </div>
  );
}
