'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { STATUS_TONE, rp, statusLabel, type Status } from '@/lib/invoice';

export type Row = { id: string; number: string; customerName: string; customerPhone: string; total: number; status: Status; deliveryType: string; createdAt: string; paidAt: string | null; count: number };

const TABS: Array<[string, string]> = [['all', 'Semua'], ['UNPAID', 'Belum dibayar'], ['PAID', 'Sudah dibayar'], ['SHIPPED', 'Dikirim/diambil'], ['DONE', 'Selesai'], ['CANCELLED', 'Dibatalkan']];

export function StatusPill({ s, deliveryType }: { s: Status; deliveryType?: string }) {
  const [bg, fg] = STATUS_TONE[s];
  return <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>{statusLabel(s, deliveryType)}</span>;
}

export default function InvoiceList({ rows, qrisActive }: { rows: Row[]; qrisActive: boolean }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const month = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 7);
  const unpaid = rows.filter((r) => r.status === 'UNPAID');
  const paidMonth = rows.filter((r) => ['PAID', 'SHIPPED', 'DONE'].includes(r.status) && (r.paidAt ?? r.createdAt).slice(0, 7) === month);
  const query = q.trim().toLowerCase();
  const shown = rows.filter((r) => (tab === 'all' || r.status === tab) && (!query || r.customerName.toLowerCase().includes(query) || r.number.toLowerCase().includes(query) || r.customerPhone.includes(query)));
  const count = (k: string) => (k === 'all' ? rows.length : rows.filter((r) => r.status === k).length);

  return (
    <main className="app-sheet inner">
      <section className="money-card light rise">
        <span className="mc-label">Belum dibayar · {unpaid.length} invoice</span>
        <strong style={{ fontSize: 26 }}>{rp(unpaid.reduce((s, r) => s + r.total, 0))}</strong>
        <span className="mc-sub">Dibayar bulan ini: {rp(paidMonth.reduce((s, r) => s + r.total, 0))}</span>
        <Link href="/app/invoice/baru" className="mc-foot">Buat invoice baru <Icon name="plus" size={18} /></Link>
      </section>

      {!qrisActive && <div className="note" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="qris" size={20} />QRIS belum aktif. Invoice tetap bisa dibuat; kode QRIS ikut terlampir otomatis setelah aktif.</div>}

      <label className="search-pill">
        <Icon name="search" size={18} color="var(--muted)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, nomor HP atau no. invoice" aria-label="Cari invoice" />
      </label>
      <nav className="tab-row" aria-label="Status invoice">
        {TABS.map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{l} ({count(k)})</button>)}
      </nav>

      {shown.length === 0 ? (
        <div className="empty-card">
          <Icon name="file" size={28} color="var(--blue)" />
          <strong>{rows.length ? 'Tidak ada invoice di sini' : 'Belum ada invoice'}</strong>
          <span className="hint">{rows.length ? 'Coba tab atau kata kunci lain.' : 'Buat invoice dalam 3 langkah, lalu kirim ke pelanggan lewat WhatsApp lengkap dengan QRIS.'}</span>
          {!rows.length && <Link href="/app/invoice/baru" className="btn btn-primary" style={{ marginTop: 6, gap: 6 }}><Icon name="plus" size={18} />Buat invoice</Link>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map((r) => (
            <Link key={r.id} href={`/app/invoice/${r.id}`} className="inv-row tap">
              <span className="avatar" style={{ width: 42, height: 42, fontSize: 17 }}>{(r.customerName[0] || '?').toUpperCase()}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.customerName}</strong>
                <span className="hint">{r.number} · {r.count} barang</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <strong style={{ fontSize: 14.5 }}>{rp(r.total)}</strong>
                <StatusPill s={r.status} deliveryType={r.deliveryType} />
              </span>
            </Link>
          ))}
        </div>
      )}
      <Link href="/app/invoice/baru" className="fab" aria-label="Buat invoice baru"><Icon name="plus" size={26} /></Link>
    </main>
  );
}
