import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { AcrylicThumb, StickerThumb } from '@/components/StickerArt';
import { waLink } from '@/lib/contact';
import { db } from '@/lib/db';
import { FLOW, STATUS_LABEL, STATUS_TONE, rp, type OrderItem, type StickerStatus } from '@/lib/sticker';
import PageTop from '../../PageTop';
import { stickerContext } from '../data';
import CancelOrder from './CancelOrder';

export const metadata = { title: 'Pesanan stiker · AIPOS' };
export const dynamic = 'force-dynamic';

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB' : '');

export default async function StickerOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string }> }) {
  const { user } = await stickerContext();
  const { id } = await params;
  const { baru } = await searchParams;
  const o = await db.stickerOrder.findFirst({ where: { id, userId: user.id } });
  if (!o) notFound();
  const store = await db.application.findUnique({ where: { id: o.applicationId }, select: { businessName: true } });
  const items = o.items as unknown as OrderItem[];
  const s = o.status as StickerStatus;
  const [bg, fg] = STATUS_TONE[s];
  const history = (o.history as unknown as Array<{ s: StickerStatus; at: string }>) ?? [];
  const atOf = (st: StickerStatus) => history.filter((h) => h.s === st).at(-1)?.at;
  const idx = FLOW.indexOf(s);
  const wa = waLink(`Halo AIPOS, saya mau bayar pesanan stiker ${o.number} (${rp(o.total)}) untuk ${store?.businessName ?? 'toko saya'}.`);

  return (
    <>
      <PageTop title={o.number} sub={store?.businessName ?? undefined} back="/app/stiker" />
      <main className="app-sheet inner" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {baru && s === 'UNPAID' && (
          <section className="card pop" style={{ gap: 6, alignItems: 'center', textAlign: 'center' }}>
            <Icon name="checkCircle" size={40} color="var(--ok)" />
            <strong style={{ fontSize: 17 }}>Pesanan dibuat</strong>
            <span className="hint">Tim AIPOS mengirim link pembayaran ke WhatsApp {user.phone} di jam kerja.</span>
          </section>
        )}

        <section className="card" style={{ gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 15 }}>Status</strong>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: bg, color: fg }}>{STATUS_LABEL[s]}</span>
          </div>
          {s === 'CANCELLED' ? <span className="hint">Dibatalkan {when(atOf('CANCELLED'))}</span> : (
            <ol className="timeline">
              {FLOW.map((st, i) => (
                <li key={st} className={i <= idx ? 'done' : i === idx + 1 ? 'cur' : ''}>
                  <span className="dot">{i <= idx && <Icon name="check" size={14} strokeWidth={3} />}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <strong style={{ fontSize: 14 }}>{st === 'UNPAID' ? 'Pesanan dibuat' : STATUS_LABEL[st]}</strong>
                    <span className="hint">{when(atOf(st))}{st === 'SHIPPED' && o.trackingNo ? ` · ${o.courier ?? 'Kurir'} ${o.trackingNo}` : ''}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {s === 'UNPAID' && (
            <>
              <a className="btn btn-primary btn-block" href={wa} target="_blank" rel="noreferrer" style={{ gap: 8 }}><Icon name="whatsapp" size={18} />Minta link pembayaran</a>
              <CancelOrder id={o.id} />
            </>
          )}
          {s === 'SHIPPED' && o.trackingNo && <span className="note">Nomor resi <b>{o.trackingNo}</b>{o.courier ? ` (${o.courier})` : ''}. Lacak di situs kurir.</span>}
        </section>

        <section className="card" style={{ gap: 4 }}>
          <strong style={{ fontSize: 15, marginBottom: 6 }}>Detail pesanan</strong>
          {items.map((i) => (
            <div key={i.code} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0' }}>
              {i.code === 'STIKER' ? <StickerThumb size={40} /> : <AcrylicThumb size={40} />}
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><strong style={{ fontSize: 14 }}>{i.name}</strong><span className="hint">{i.qty} × {rp(i.price)}</span></span>
              <strong style={{ fontSize: 14 }}>{rp(i.price * i.qty)}</strong>
            </div>
          ))}
          <div className="sum-row" style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 10 }}><span>Biaya pengiriman</span><span>{rp(o.shippingFee)}</span></div>
          <div className="sum-row total"><span>Total pembayaran</span><span>{rp(o.total)}</span></div>
          {o.normalTotal > o.subtotal && <span className="hint" style={{ color: 'var(--ok)', fontWeight: 700 }}>Hemat {rp(o.normalTotal - o.subtotal)}</span>}
        </section>

        <section className="card" style={{ gap: 4, fontSize: 13.5 }}>
          <strong style={{ fontSize: 15, marginBottom: 4 }}>Dikirim ke · {o.label}</strong>
          <strong>{o.recipient} · {o.phone}</strong>
          <span>{[o.address, o.kelurahan, o.kecamatan, o.city, o.province, o.postalCode].join(', ')}</span>
          {o.timeSlot && <span className="hint">Waktu pengiriman {o.timeSlot}</span>}
          {o.courierNote && <span className="hint">Catatan: {o.courierNote}</span>}
        </section>

        <a className="btn btn-ghost btn-block" href={waLink(`Halo AIPOS, saya mau tanya pesanan stiker ${o.number}.`)} target="_blank" rel="noreferrer" style={{ gap: 8 }}><Icon name="help" size={18} />Tanya CS</a>
      </main>
    </>
  );
}
