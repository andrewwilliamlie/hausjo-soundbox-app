'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { FLOW, PAY_METHODS, fmtDate, rp, statusLabel, type InvoiceItem, type Status } from '@/lib/invoice';
import { Sheet, useToast } from '../../Sheets';
import { deleteInvoice, setStatus } from '../actions';
import { StatusPill } from '../InvoiceList';

type Inv = {
  id: string; number: string; customerName: string; customerPhone: string; orderDate: string; note: string; items: InvoiceItem[];
  deliveryType: string; deliveryAddress: string; deliveryFee: number; subtotal: number; discount: number; tax: number; taxPct: number; total: number;
  status: Status; payMethod: string; history: Array<{ s: Status; at: string; m?: string }>;
};

const fmtDT = (iso: string) => new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function InvoiceDetail({ inv }: { inv: Inv }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState<'' | 'pay' | 'cancel'>('');
  const [method, setMethod] = useState('QRIS');
  const [error, setError] = useState('');
  const [toast, setToast] = useToast();
  const idx = FLOW.indexOf(inv.status);
  const next = inv.status !== 'CANCELLED' && idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const at = (s: Status) => { const h = [...inv.history].reverse().find((x) => x.s === s); return h ? fmtDT(h.at) + (h.m ? ` · ${h.m}` : '') : ''; };

  function go(s: Status, m?: string) {
    setError('');
    start(async () => {
      const r = await setStatus(inv.id, s, m);
      if (!r.ok) return setError(r.error);
      setSheet('');
      setToast(`Status: ${statusLabel(s, inv.deliveryType)}`);
      router.refresh();
    });
  }

  const nextLabel = next === 'PAID' ? 'Tandai sudah dibayar' : next === 'SHIPPED' ? (inv.deliveryType === 'ambil' ? 'Tandai siap diambil' : 'Tandai sudah dikirim') : next === 'DONE' ? 'Tandai selesai' : '';

  return (
    <main className="app-sheet inner">
      <section className="card rise" style={{ alignItems: 'center', textAlign: 'center', gap: 6 }}>
        <span className="avatar">{(inv.customerName[0] || '?').toUpperCase()}</span>
        <strong>{inv.customerName}</strong>
        <strong style={{ fontSize: 26 }}>{rp(inv.total)}</strong>
        <StatusPill s={inv.status} deliveryType={inv.deliveryType} />
      </section>

      {inv.status !== 'CANCELLED' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/app/invoice/${inv.id}/bagikan`} className="btn btn-primary" style={{ flex: 1, gap: 8 }}><Icon name="whatsapp" size={18} />Bagikan</Link>
          {next && <button type="button" className="btn btn-ghost" style={{ flex: 1 }} disabled={pending} onClick={() => (next === 'PAID' ? setSheet('pay') : go(next))}>{nextLabel}</button>}
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}

      <section className="card rise rise-1" style={{ gap: 12 }}>
        <strong style={{ fontSize: 15 }}>Status invoice</strong>
        {inv.status === 'CANCELLED' ? <span className="hint">Invoice dibatalkan {at('CANCELLED')}.</span> : (
          <ol className="timeline">
            {FLOW.map((s, i) => (
              <li key={s} className={i <= idx ? 'done' : i === idx + 1 ? 'cur' : ''}>
                <span className="dot">{i <= idx && <Icon name="check" size={14} strokeWidth={3} />}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{statusLabel(s, inv.deliveryType)}</strong><span className="hint">{at(s)}</span></span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card rise rise-2" style={{ gap: 2 }}>
        <strong style={{ fontSize: 15, marginBottom: 4 }}>Pelanggan</strong>
        <div className="sum-row"><span className="hint">Nomor WhatsApp</span><span>{inv.customerPhone || '–'}</span></div>
        <div className="sum-row"><span className="hint">Tanggal pesanan</span><span>{fmtDate(inv.orderDate)}</span></div>
        <div className="sum-row"><span className="hint">Pengiriman</span><span style={{ textAlign: 'right' }}>{inv.deliveryType === 'kirim' ? `Dikirim · ${inv.deliveryAddress}` : 'Diambil langsung'}</span></div>
        {inv.note && <div className="sum-row"><span className="hint">Catatan</span><span style={{ textAlign: 'right' }}>{inv.note}</span></div>}
        {inv.payMethod && <div className="sum-row"><span className="hint">Metode bayar</span><span>{inv.payMethod}</span></div>}
      </section>

      <section className="card rise rise-3" style={{ gap: 0 }}>
        <strong style={{ fontSize: 15, marginBottom: 6 }}>Pesanan</strong>
        {inv.items.map((it, i) => <div key={i} className="sum-row"><span>{it.name} × {it.qty}</span><span>{rp(it.price * it.qty)}</span></div>)}
        <div className="sum-row" style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 10 }}><span>Subtotal</span><span>{rp(inv.subtotal)}</span></div>
        {inv.discount > 0 && <div className="sum-row"><span>Diskon</span><span>−{rp(inv.discount)}</span></div>}
        {inv.tax > 0 && <div className="sum-row"><span>Pajak ({inv.taxPct}%)</span><span>{rp(inv.tax)}</span></div>}
        {inv.deliveryType === 'kirim' && <div className="sum-row"><span>Ongkos kirim</span><span>{rp(inv.deliveryFee)}</span></div>}
        <div className="sum-row total"><span>Total</span><span>{rp(inv.total)}</span></div>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {inv.status !== 'CANCELLED' && inv.status !== 'DONE' && <Link href={`/app/invoice/${inv.id}/ubah`} className="btn btn-ghost" style={{ flex: 1, gap: 6 }}><Icon name="file" size={18} />Ubah</Link>}
        {['UNPAID', 'PAID'].includes(inv.status) && <button type="button" className="btn btn-ghost" style={{ flex: 1, color: 'var(--err)' }} onClick={() => setSheet('cancel')}>Batalkan</button>}
        {inv.status === 'CANCELLED' && <button type="button" className="btn btn-ghost" style={{ flex: 1, color: 'var(--err)' }} disabled={pending}
          onClick={() => start(async () => { const r = await deleteInvoice(inv.id); if (!r.ok) return setError(r.error); router.push('/app/invoice'); })}>Hapus invoice</button>}
      </div>

      {sheet === 'pay' && (
        <Sheet label="Metode pembayaran" onClose={() => setSheet('')}>
          <h2 className="h2" style={{ fontSize: 19 }}>Dibayar dengan apa?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PAY_METHODS.map((m) => <button key={m} type="button" className="chip" aria-pressed={method === m} onClick={() => setMethod(m)}>{m}</button>)}
          </div>
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => go('PAID', method)}>{pending ? 'Menyimpan…' : `Tandai lunas · ${rp(inv.total)}`}</button>
        </Sheet>
      )}
      {sheet === 'cancel' && (
        <Sheet label="Batalkan invoice" onClose={() => setSheet('')}>
          <h2 className="h2" style={{ fontSize: 19 }}>Batalkan {inv.number}?</h2>
          <p className="hint">Invoice tidak bisa diaktifkan lagi. Pelanggan tidak menerima pemberitahuan otomatis.</p>
          <button type="button" className="btn" style={{ background: 'var(--err)', color: '#fff' }} disabled={pending} onClick={() => go('CANCELLED')}>Ya, batalkan</button>
        </Sheet>
      )}
      {toast}
    </main>
  );
}
