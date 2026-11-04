import Link from 'next/link';
import Icon from '@/components/Icon';
import { loadMerchantView } from '@/lib/merchant-view';
import PageTop from '../PageTop';

export const metadata = { title: 'Transaksi · HausJo' };
export const dynamic = 'force-dynamic';

const PERIODS: Array<[string, string]> = [['hari', 'Hari ini'], ['7', '7 hari'], ['30', '30 hari']];

// Transaction history. The bank/aggregator feed is not connected yet, so this shows the store card and an honest empty state.
export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const app = await loadMerchantView();
  const { p = 'hari' } = await searchParams;
  const active = app.status === 'ACTIVE';
  return (
    <>
      <PageTop title="Daftar transaksi" action={<span className="top-chip" aria-disabled="true" title="Segera hadir"><Icon name="download" size={16} />Laporan</span>}>
        <nav className="seg" aria-label="Periode">
          {PERIODS.map(([k, label]) => <Link key={k} href={`/app/transaksi?p=${k}`} aria-current={p === k ? 'page' : undefined}>{label}</Link>)}
        </nav>
      </PageTop>
      <main className="app-sheet inner">
        <section className="store-card rise">
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong style={{ fontSize: 15, color: 'var(--navy)', letterSpacing: .3 }}>{app.businessName}</strong>
            <span className="hint">MID {app.mid ?? '–'} · NMID {app.nmid ?? '–'}</span>
            <strong style={{ fontSize: 20 }}>{active ? 'Rp –' : 'QRIS belum aktif'}</strong>
          </span>
          <Link href="/app/qris" className="square-btn" aria-label="Lihat QRIS"><Icon name="chevron" size={20} /></Link>
        </section>
        <div className="empty-card rise rise-1">
          <Icon name="list" size={28} color="var(--blue)" />
          <strong>{active ? 'Riwayat transaksi segera hadir' : 'Belum ada transaksi'}</strong>
          <span className="hint">
            {active
              ? 'Pembayaran QRIS tetap masuk dan dicairkan ke rekening Anda seperti biasa. Daftar transaksi per pembayaran (GoPay, OVO, DANA, m-banking) akan tampil di sini setelah tersambung dengan bank.'
              : 'Transaksi tampil di sini setelah QRIS Anda aktif.'}
          </span>
        </div>
      </main>
    </>
  );
}
