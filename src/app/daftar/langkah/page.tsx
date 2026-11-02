import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireMerchant } from '@/lib/auth';
import Steps from './Steps';

export const metadata = { title: 'Langkah pendaftaran · HausJo' };
export const dynamic = 'force-dynamic';

export default async function LangkahPage() {
  const { application: app } = await requireMerchant();
  if (!app) redirect('/daftar');
  if (app.status !== 'DRAFT') redirect('/app');

  const uploaded = Object.fromEntries(app.documents.map((d) => [d.kind, true]));
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">HAUS<span>JO</span></Link>
      </header>
      <Steps
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
          lat: app.lat,
          lng: app.lng,
          turnover: app.turnover
        }}
        uploaded={uploaded}
        product={app.product}
      />
    </div>
  );
}
