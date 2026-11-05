import Logo from '@/components/Logo';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireMerchant } from '@/lib/auth';
import { db } from '@/lib/db';
import Steps from './Steps';

export const metadata = { title: 'Langkah pendaftaran · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function LangkahPage() {
  const { user, application: app, outletCount } = await requireMerchant();
  if (!app) redirect('/daftar');
  if (app.status !== 'DRAFT') redirect('/app');

  const uploaded = Object.fromEntries(app.documents.map((d) => [d.kind, true]));
  // An extra store reuses the owner's e-KTP and selfie, so it starts at the store details.
  // Payout accounts already used by this owner's other stores, offered as "pakai rekening yang sama".
  const others = await db.application.findMany({ where: { userId: user.id, id: { not: app.id }, accountNo: { not: null } }, orderBy: { createdAt: 'asc' } });
  const seen = new Set<string>();
  const knownBanks = others.filter((o) => { const k = `${o.bankName}|${o.accountNo}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((o) => ({ fromId: o.id, label: `${o.bankName} ••••${(o.accountNo ?? '').slice(-4)}`, holder: o.accountHolder ?? '' }));
  const startStep = outletCount > 1 && uploaded.KTP && uploaded.SELFIE && app.ktpName ? 2 : 0;
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" aria-label="AIPOS beranda"><Logo height={26} /></Link>
        {outletCount > 1 && <Link href="/app/toko" style={{ fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>Toko lain</Link>}
      </header>
      <Steps
        startStep={startStep}
        initial={{
          ktpName: app.ktpName ?? '',
          nik: app.nik ?? '',
          birthPlace: app.birthPlace ?? '',
          birthDate: app.birthDate ?? '',
          gender: app.gender ?? '',
          ktpAddress: app.ktpAddress ?? '',
          ocrConfidence: app.ocrConfidence,
          hasStore: app.hasStore,
          sellsOffline: app.sellsOffline,
          sellsOnline: app.sellsOnline,
          onlineLink: app.onlineLink ?? '',
          businessType: app.businessType ?? '',
          businessName: app.businessName ?? '',
          street: app.street ?? '',
          number: app.number ?? '',
          rt: app.rt ?? '',
          rw: app.rw ?? '',
          kelurahan: app.kelurahan ?? '',
          kecamatan: app.kecamatan ?? '',
          city: app.city ?? '',
          province: app.province ?? '',
          postalCode: app.postalCode ?? '',
          villageCode: app.villageCode ?? '',
          lat: app.lat,
          lng: app.lng,
          turnover: app.turnover,
          bankName: app.bankName ?? 'BCA',
          accountNo: app.accountNo ?? '',
          accountHolder: app.accountHolder ?? app.ktpName ?? '',
          settlement: app.settlement
        }}
        knownBanks={knownBanks}
        uploaded={uploaded}
        product={app.product}
      />
    </div>
  );
}
