import Link from 'next/link';
import Icon from '@/components/Icon';
import { loadMerchantView } from '@/lib/merchant-view';
import PageTop from '../PageTop';

export const metadata = { title: 'QRIS · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function QrisPage() {
  const app = await loadMerchantView();
  const active = app.status === 'ACTIVE';
  return (
    <>
      <PageTop title="QRIS saya" />
      <main className="app-sheet inner" style={{ alignItems: 'stretch' }}>
        {active && app.stickerId ? (
          <section className="card rise" style={{ alignItems: 'center', textAlign: 'center', gap: 12 }}>
            <strong style={{ fontSize: 17 }}>{app.businessName}</strong>
            <span className="hint">NMID {app.nmid}</span>
            {app.stickerIsImage
              ? <img src={`/api/files/${app.stickerId}`} alt={`QRIS ${app.businessName}`} style={{ width: '100%', maxWidth: 320, borderRadius: 12, border: '1px solid var(--line)' }} />
              : <div className="empty-card" style={{ width: '100%' }}><Icon name="file" size={28} color="var(--blue)" /><span>Stiker QRIS berbentuk PDF</span></div>}
            <a className="btn btn-primary btn-block" href={`/api/files/${app.stickerId}?download=1`} style={{ gap: 8 }}><Icon name="download" size={18} />Unduh &amp; cetak stiker</a>
            <Link className="btn btn-ghost btn-block" href="/app/stiker" style={{ gap: 8 }}><Icon name="printer" size={18} />Pesan stiker cetak / stand akrilik</Link>
          </section>
        ) : (
          <div className="empty-card rise">
            <Icon name="qris" size={30} color="var(--blue)" />
            <strong>QRIS belum aktif</strong>
            <span className="hint">{app.bankSet ? 'Bank sedang menerbitkan QRIS Anda, biasanya 1–2 hari kerja. Stiker muncul di sini dan dikirim ke email.' : 'Tambahkan rekening pencairan dulu agar QRIS bisa diterbitkan bank.'}</span>
            <Link href="/app" className="btn btn-primary" style={{ marginTop: 6 }}>Lihat langkah aktivasi</Link>
          </div>
        )}
        <section className="card rise rise-1" style={{ gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Cara pakai</strong>
          <span className="hint">Tempel stiker di kasir. Pembeli memindai dengan GoPay, OVO, DANA, ShopeePay atau m-banking apa pun. Uang masuk ke rekening sesuai jadwal pencairan Anda.</span>
        </section>
      </main>
    </>
  );
}
