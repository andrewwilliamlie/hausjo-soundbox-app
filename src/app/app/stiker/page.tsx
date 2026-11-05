import Link from 'next/link';
import Icon from '@/components/Icon';
import { AcrylicThumb, StickerHero, StickerThumb } from '@/components/StickerArt';
import { db } from '@/lib/db';
import { STATUS_LABEL, STATUS_TONE, itemsText, rp, type OrderItem, type StickerStatus } from '@/lib/sticker';
import PageTop from '../PageTop';
import { stickerContext } from './data';

export const metadata = { title: 'Pesan stiker · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function StickerOrdersPage() {
  const { user, app, outletCount, active } = await stickerContext();
  const orders = await db.stickerOrder.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  const names = new Map((await db.application.findMany({ where: { userId: user.id }, select: { id: true, businessName: true } })).map((a) => [a.id, a.businessName ?? 'Toko']));

  return (
    <>
      <PageTop title="Pesan stiker" sub="Stiker QRIS & stand akrilik" />
      <main className="app-sheet inner" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section className="card" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          <StickerHero />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <strong style={{ fontSize: 16 }}>Stiker QRIS cetak untuk {app.businessName}</strong>
            {active ? (
              <>
                <span className="hint">Pilih stiker saja atau stiker dengan stand akrilik. Dikirim ke alamat Anda.</span>
                <Link href="/app/stiker/pesan" className="btn btn-primary btn-block" style={{ gap: 8 }}><Icon name="printer" size={18} />Pesan sekarang</Link>
              </>
            ) : (
              <>
                <span className="hint">Stiker berisi QRIS toko ini, jadi baru bisa dipesan setelah QRIS aktif. Kami kabari lewat email saat QRIS terbit.</span>
                {outletCount > 1 && <Link href="/app/toko" className="btn btn-ghost btn-block">Pilih toko lain yang QRIS-nya aktif</Link>}
              </>
            )}
          </div>
        </section>

        <h2 className="h2" style={{ fontSize: 16, margin: '6px 0 0' }}>Pesanan saya</h2>
        {orders.length === 0 && <div className="empty-card"><Icon name="box" size={28} color="var(--blue)" /><span>Belum ada pesanan stiker.</span></div>}
        {orders.map((o) => {
          const items = o.items as unknown as OrderItem[];
          const s = o.status as StickerStatus;
          const [bg, fg] = STATUS_TONE[s];
          return (
            <Link key={o.id} href={`/app/stiker/${o.id}`} className="card" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'var(--ink)' }}>
              {items.some((i) => i.code === 'AKRILIK') ? <AcrylicThumb size={42} /> : <StickerThumb size={42} />}
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 14 }}>{o.number}</strong><strong style={{ fontSize: 14 }}>{rp(o.total)}</strong></span>
                <span className="hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemsText(items)}{outletCount > 1 ? ` · ${names.get(o.applicationId) ?? ''}` : ''}</span>
                <span style={{ alignSelf: 'flex-start', fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: bg, color: fg }}>{STATUS_LABEL[s]}</span>
              </span>
              <Icon name="chevron" size={18} color="var(--muted)" />
            </Link>
          );
        })}
      </main>
    </>
  );
}
