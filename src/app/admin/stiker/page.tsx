import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { KIND_LABEL, STATUS_LABEL, STATUS_TONE, asKind, itemsText, rp, statusLabel, type OrderItem, type StickerStatus } from '@/lib/sticker';
import AdminHeader from '../AdminHeader';
import { updateStickerOrder } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pesanan · Admin AIPOS' };

const FILTERS: Array<[string, string]> = [['open', 'Perlu diproses'], ['UNPAID', 'Belum bayar'], ['PAID', 'Sudah bayar'], ['PRINTING', 'Dicetak'], ['SHIPPED', 'Dikirim'], ['DONE', 'Selesai'], ['CANCELLED', 'Batal'], ['all', 'Semua']];
const STATUSES = Object.keys(STATUS_LABEL) as StickerStatus[];
const when = (d: Date) => d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });

const KINDS: Array<[string, string]> = [['all', 'Semua produk'], ['STIKER', 'Stiker'], ['EDC', 'EDC'], ['SOUNDBOX', 'Soundbox'], ['KERTAS', 'Kertas struk']];

export default async function StickerOrdersAdmin({ searchParams }: { searchParams: Promise<{ f?: string; k?: string }> }) {
  const admin = await requireAdmin(['ACTIVATION']);
  const { f = 'open', k = 'all' } = await searchParams;
  const kindWhere = ['STIKER', 'EDC', 'SOUNDBOX', 'KERTAS'].includes(k) ? { kind: k } : {};
  const where = { ...kindWhere, ...(f === 'all' ? {} : f === 'open' ? { status: { in: ['UNPAID', 'PAID', 'PRINTING'] as StickerStatus[] } } : { status: f as StickerStatus }) };
  const orders = await db.stickerOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { email: true } } } });
  const stores = await db.application.findMany({
    where: { id: { in: [...new Set(orders.map((o) => o.applicationId))] } },
    select: { id: true, businessName: true, ticket: true, nmid: true, documents: { where: { kind: 'QRIS_STICKER' }, select: { id: true } } }
  });
  const byId = new Map(stores.map((s) => [s.id, s]));
  const counts = await db.stickerOrder.groupBy({ by: ['status'], where: kindWhere, _count: true });
  const count = (k: string) => k === 'all' ? counts.reduce((s, c) => s + c._count, 0) : k === 'open'
    ? counts.filter((c) => ['UNPAID', 'PAID', 'PRINTING'].includes(c.status)).reduce((s, c) => s + c._count, 0)
    : counts.find((c) => c.status === k)?._count ?? 0;

  return (
    <div className="admin">
      <AdminHeader admin={admin} tab="stiker" />
      <div className="admin-wrap" style={{ maxWidth: 1000 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Pesanan stiker, EDC, Soundbox &amp; kertas struk</h1>
          <p className="hint" style={{ marginTop: 4 }}>Alur: kirim link pembayaran ke WhatsApp merchant → tandai Sudah bayar → stiker: unduh QRIS toko lalu cetak; EDC/Soundbox: siapkan perangkat dan catat SN → Dikirim dengan nomor resi. Merchant menerima email tiap status berubah.</p>
        </div>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} aria-label="Filter produk">
          {KINDS.map(([key, label]) => (
            <Link key={key} href={`/admin/stiker?f=${f}&k=${key}`} className="chip" aria-pressed={k === key} style={{ textDecoration: 'none', minHeight: 36, padding: '8px 12px' }}>{label}</Link>
          ))}
        </nav>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} aria-label="Filter status">
          {FILTERS.map(([key, label]) => (
            <Link key={key} href={`/admin/stiker?f=${key}&k=${k}`} className="chip" aria-pressed={f === key} style={{ textDecoration: 'none', minHeight: 36, padding: '8px 12px' }}>{label} ({count(key)})</Link>
          ))}
        </nav>
        {orders.length === 0 && <p className="hint">Tidak ada pesanan di filter ini.</p>}
        {orders.map((o) => {
          const s = o.status as StickerStatus;
          const kind = asKind(o.kind);
          const [bg, fg] = STATUS_TONE[s];
          const store = byId.get(o.applicationId);
          const sticker = store?.documents[0];
          const wa = `https://wa.me/${o.phone.replace(/^0/, '62').replace(/^\+/, '')}`;
          return (
            <section key={o.id} className="card" style={{ gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 15 }}>{o.number}</strong>
                  <span className="tag">{KIND_LABEL[kind]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: bg, color: fg }}>{statusLabel(s, kind)}</span>
                  <span className="hint">{when(o.createdAt)} WIB</span>
                </span>
                <strong>{rp(o.total)}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, fontSize: 13.5 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong>Toko</strong>
                  <Link href={`/admin?id=${o.applicationId}`}>{store?.businessName ?? '-'} · {store?.ticket}</Link>
                  <span>NMID {store?.nmid ?? '-'}</span>
                  {kind === 'STIKER' && (sticker ? <a href={`/api/files/${sticker.id}?download=1`}>Unduh stiker QRIS untuk dicetak</a> : <span style={{ color: 'var(--err)' }}>Stiker QRIS belum diunggah</span>)}
                  <strong style={{ marginTop: 6 }}>Pesanan</strong>
                  <span>{itemsText(o.items as unknown as OrderItem[])}</span>
                  <span className="hint">Barang {rp(o.subtotal)} + ongkir {rp(o.shippingFee)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong>Kirim ke · {o.label}</strong>
                  <span>{o.recipient} · <a href={wa} target="_blank" rel="noreferrer">{o.phone}</a></span>
                  <span>{o.address}, {o.kelurahan}, {o.kecamatan}, {o.city}, {o.province} {o.postalCode}</span>
                  {o.timeSlot && <span className="hint">Jam kirim {o.timeSlot}</span>}
                  {o.courierNote && <span className="hint">Catatan: {o.courierNote}</span>}
                  <span className="hint">Email merchant: {o.user.email}</span>
                </div>
              </div>
              <form action={updateStickerOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, alignItems: 'end', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <input type="hidden" name="id" value={o.id} />
                <label className="field">Status
                  <select name="status" className="input" defaultValue={s}>{STATUSES.map((x) => <option key={x} value={x}>{statusLabel(x, kind)}</option>)}</select>
                </label>
                <label className="field">Metode bayar
                  <input name="payMethod" className="input" defaultValue={o.payMethod ?? ''} placeholder="QRIS / transfer" />
                </label>
                <label className="field">Kurir
                  <input name="courier" className="input" defaultValue={o.courier ?? ''} placeholder="JNE, SiCepat…" />
                </label>
                <label className="field">Nomor resi
                  <input name="trackingNo" className="input" defaultValue={o.trackingNo ?? ''} />
                </label>
                <label className="field" style={{ gridColumn: '1 / -1' }}>{kind === 'EDC' || kind === 'SOUNDBOX' ? 'Catatan internal (mis. SN perangkat)' : 'Catatan internal'}
                  <input name="adminNote" className="input" defaultValue={o.adminNote ?? ''} />
                </label>
                <button className="btn btn-primary">Simpan</button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
