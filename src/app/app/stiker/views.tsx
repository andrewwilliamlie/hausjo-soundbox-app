import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Icon from '@/components/Icon';
import { ProductThumb, ShopHero } from '@/components/StickerArt';
import { waLink } from '@/lib/contact';
import { db } from '@/lib/db';
import { FLOW, KIND_NAME, KIND_PATH, STATUS_TONE, asKind, feeText, itemsText, rp, statusLabel, type Kind, type OrderItem, type StickerStatus } from '@/lib/sticker';
import PageTop from '../PageTop';
import CancelOrder from './[id]/CancelOrder';
import { stickerContext } from './data';
import OrderWizard from './OrderWizard';

const COPY: Record<Kind, { title: string; sub: string; cta: string; intro: (store: string) => string; empty: string }> = {
  STIKER: {
    title: 'Pesan stiker', sub: 'Stiker QRIS & stand akrilik', cta: 'Pesan sekarang',
    intro: (s) => `Stiker QRIS cetak untuk ${s}`, empty: 'Belum ada pesanan stiker.'
  },
  EDC: {
    title: 'Beli EDC', sub: 'PAX A620 & PAX A920 Pro', cta: 'Beli sekarang',
    intro: (s) => `Mesin EDC untuk ${s}`, empty: 'Belum ada pesanan EDC.'
  },
  SOUNDBOX: {
    title: 'Beli Soundbox', sub: 'Soundbox QRIS', cta: 'Beli sekarang',
    intro: (s) => `Soundbox QRIS untuk ${s}`, empty: 'Belum ada pesanan Soundbox.'
  }
};

/** Can this store order this kind? A sticker needs an active QRIS; an EDC only a submitted, not rejected, signup. */
const canOrder = (kind: Kind, status: string) => (kind === 'STIKER' ? status === 'ACTIVE' : status !== 'REJECTED');

export async function OrdersList({ kind }: { kind: Kind }) {
  const { user, app, outletCount } = await stickerContext();
  const C = COPY[kind];
  const ok = canOrder(kind, app.status);
  const orders = await db.stickerOrder.findMany({ where: { userId: user.id, kind }, orderBy: { createdAt: 'desc' }, take: 50 });
  const names = new Map((await db.application.findMany({ where: { userId: user.id }, select: { id: true, businessName: true } })).map((a) => [a.id, a.businessName ?? 'Toko']));

  return (
    <>
      <PageTop title={C.title} sub={C.sub} />
      <main className="app-sheet inner" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section className="card" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          <ShopHero kind={kind} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <strong style={{ fontSize: 16 }}>{C.intro(app.businessName ?? 'toko Anda')}</strong>
            {kind === 'EDC' && (
              <span style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><ProductThumb code="A620" size={36} /><span><b>PAX A620</b> · QRIS dinamis · {rp(699000)}</span></span>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><ProductThumb code="A920PRO" size={36} /><span><b>PAX A920 Pro</b> · Debit, kredit &amp; QRIS · {rp(2999000)}</span></span>
              </span>
            )}
            {ok ? (
              <>
                {kind === 'STIKER' && <span className="hint">Pilih stiker saja atau stiker dengan stand akrilik. Dikirim ke alamat Anda.</span>}
                {kind === 'SOUNDBOX' && <span className="hint">Menyebut nominal setiap pembayaran QRIS. {rp(349000)} sekali bayar, tanpa sewa.</span>}
                <Link href={`${KIND_PATH[kind]}/pesan`} className="btn btn-primary btn-block" style={{ gap: 8 }}><Icon name={kind === 'EDC' ? 'edc' : kind === 'SOUNDBOX' ? 'speaker' : 'printer'} size={18} />{C.cta}</Link>
              </>
            ) : (
              <>
                <span className="hint">{kind === 'STIKER'
                  ? 'Stiker berisi QRIS toko ini, jadi baru bisa dipesan setelah QRIS aktif. Kami kabari lewat email saat QRIS terbit.'
                  : `Pendaftaran toko ini ditolak, jadi ${KIND_NAME[kind]} belum bisa dipesan. Hubungi CS AIPOS.`}</span>
                {outletCount > 1 && <Link href="/app/toko" className="btn btn-ghost btn-block">Pilih toko lain</Link>}
              </>
            )}
          </div>
        </section>

        <h2 className="h2" style={{ fontSize: 16, margin: '6px 0 0' }}>Pesanan saya</h2>
        {orders.length === 0 && <div className="empty-card"><Icon name="box" size={28} color="var(--blue)" /><span>{C.empty}</span></div>}
        {orders.map((o) => {
          const items = o.items as unknown as OrderItem[];
          const s = o.status as StickerStatus;
          const [bg, fg] = STATUS_TONE[s];
          return (
            <Link key={o.id} href={`${KIND_PATH[kind]}/${o.id}`} className="card" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'var(--ink)' }}>
              <ProductThumb code={items.find((i) => i.code === 'A920PRO' || i.code === 'AKRILIK')?.code ?? items[0]?.code ?? ''} size={42} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 14 }}>{o.number}</strong><strong style={{ fontSize: 14 }}>{rp(o.total)}</strong></span>
                <span className="hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemsText(items)}{outletCount > 1 ? ` · ${names.get(o.applicationId) ?? ''}` : ''}</span>
                <span style={{ alignSelf: 'flex-start', fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: bg, color: fg }}>{statusLabel(s, kind)}</span>
              </span>
              <Icon name="chevron" size={18} color="var(--muted)" />
            </Link>
          );
        })}
      </main>
    </>
  );
}

export async function NewOrder({ kind }: { kind: Kind }) {
  const { user, app } = await stickerContext();
  if (!canOrder(kind, app.status)) redirect(KIND_PATH[kind]);
  const rows = await db.shipAddress.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
  const saved = rows.map((a) => ({
    id: a.id, label: a.label, recipient: a.recipient, phone: a.phone, address: a.address, province: a.province, city: a.city,
    kecamatan: a.kecamatan, kelurahan: a.kelurahan, postalCode: a.postalCode, villageCode: a.villageCode ?? '', courierNote: a.courierNote ?? ''
  }));
  // A new address starts from the store's own address.
  const street = [app.street, app.number, app.rt || app.rw ? `RT ${app.rt ?? '-'}/RW ${app.rw ?? '-'}` : ''].filter(Boolean).join(' ');
  const blank = {
    label: 'Toko', recipient: app.ktpName ?? '', phone: user.phone, address: [app.businessName, street].filter(Boolean).join(', '),
    province: app.province ?? '', city: app.city ?? '', kecamatan: app.kecamatan ?? '', kelurahan: app.kelurahan ?? '',
    postalCode: app.postalCode ?? '', villageCode: app.villageCode ?? '', courierNote: ''
  };
  const area = [app.kelurahan, app.kecamatan].filter(Boolean).join(', ');
  return <OrderWizard kind={kind} store={{ name: app.businessName ?? 'Toko', area }} saved={saved} blank={blank} />;
}

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) + ' WIB' : '');

export async function OrderDetail({ kind, id, baru }: { kind: Kind; id: string; baru?: string }) {
  const { user } = await stickerContext();
  const o = await db.stickerOrder.findFirst({ where: { id, userId: user.id } });
  if (!o) notFound();
  if (asKind(o.kind) !== kind) redirect(`${KIND_PATH[asKind(o.kind)]}/${o.id}`);
  const store = await db.application.findUnique({ where: { id: o.applicationId }, select: { businessName: true } });
  const items = o.items as unknown as OrderItem[];
  const s = o.status as StickerStatus;
  const [bg, fg] = STATUS_TONE[s];
  const history = (o.history as unknown as Array<{ s: StickerStatus; at: string }>) ?? [];
  const atOf = (st: StickerStatus) => history.filter((h) => h.s === st).at(-1)?.at;
  const idx = FLOW.indexOf(s);
  const what = KIND_NAME[kind];
  const wa = waLink(`Halo AIPOS, saya mau bayar pesanan ${what} ${o.number} (${rp(o.total)}) untuk ${store?.businessName ?? 'toko saya'}.`);

  return (
    <>
      <PageTop title={o.number} sub={store?.businessName ?? undefined} back={KIND_PATH[kind]} />
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
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: bg, color: fg }}>{statusLabel(s, kind)}</span>
          </div>
          {s === 'CANCELLED' ? <span className="hint">Dibatalkan {when(atOf('CANCELLED'))}</span> : (
            <ol className="timeline">
              {FLOW.map((st, i) => (
                <li key={st} className={i <= idx ? 'done' : i === idx + 1 ? 'cur' : ''}>
                  <span className="dot">{i <= idx && <Icon name="check" size={14} strokeWidth={3} />}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <strong style={{ fontSize: 14 }}>{st === 'UNPAID' ? 'Pesanan dibuat' : statusLabel(st, kind)}</strong>
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
          {kind !== 'STIKER' && s === 'DONE' && <span className="note">Butuh bantuan aktivasi {what}? <a href={waLink(`Halo AIPOS, ${what} pesanan ${o.number} sudah sampai, saya mau aktivasi.`)} target="_blank" rel="noreferrer">Hubungi CS</a>.</span>}
        </section>

        <section className="card" style={{ gap: 4 }}>
          <strong style={{ fontSize: 15, marginBottom: 6 }}>Detail pesanan</strong>
          {items.map((i) => (
            <div key={i.code} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0' }}>
              <ProductThumb code={i.code} size={40} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><strong style={{ fontSize: 14 }}>{i.name}</strong><span className="hint">{i.qty} × {rp(i.price)}</span></span>
              <strong style={{ fontSize: 14 }}>{rp(i.price * i.qty)}</strong>
            </div>
          ))}
          <div className="sum-row" style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 10 }}><span>Biaya pengiriman</span><span>{feeText(o.shippingFee)}</span></div>
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

        <a className="btn btn-ghost btn-block" href={waLink(`Halo AIPOS, saya mau tanya pesanan ${what} ${o.number}.`)} target="_blank" rel="noreferrer" style={{ gap: 8 }}><Icon name="help" size={18} />Tanya CS</a>
      </main>
    </>
  );
}
