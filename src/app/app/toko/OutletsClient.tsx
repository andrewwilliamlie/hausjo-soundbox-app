'use client';

import { useState, useTransition } from 'react';
import Icon, { IconTile } from '@/components/Icon';
import { Sheet } from '../Sheets';
import { addOutlet, selectOutlet } from './actions';

export type Outlet = { id: string; name: string; area: string; product: string; nmid: string | null; status: string; bg: string; fg: string; current: boolean };

/** Pick which store (branch/outlet) the app shows, or add a new one. */
export default function OutletsClient({ outlets, full }: { outlets: Outlet[]; full: boolean }) {
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState<'QRIS' | 'SOUNDBOX'>('QRIS');
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState('');

  return (
    <main className="app-sheet inner">
      <p className="hint" style={{ fontSize: 13.5 }}>Punya beberapa cabang atau outlet? Pilih toko yang ingin dipantau. Beranda, QRIS, pencairan dan invoice mengikuti toko yang dipilih.</p>
      {full && <p className="err">Maksimal 20 toko per akun. Hubungi CS untuk menambah.</p>}

      <div role="radiogroup" aria-label="Pilih toko" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {outlets.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.current} className="cat-row tap" disabled={pending}
            onClick={() => { if (o.current) return; setBusyId(o.id); start(() => selectOutlet(o.id)); }}>
            <span className={`radio-dot${o.current ? ' on' : ''}`} aria-hidden="true" />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
              <strong style={{ fontSize: 14.5 }}>{o.name}</strong>
              <span className="hint">{o.area || 'Alamat belum diisi'} · {o.product}</span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tag" style={{ background: o.bg, color: o.fg }}>{o.status}</span>
                {o.nmid && <span className="hint">NMID {o.nmid}</span>}
                {o.current && <span className="tag ok">Sedang dilihat</span>}
                {busyId === o.id && pending && <span className="spin" aria-label="Membuka toko" />}
              </span>
            </span>
            <IconTile name="store" tone={o.current ? 'blue' : 'slate'} size={44} />
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-ghost" style={{ gap: 8 }} onClick={() => setAdding(true)}><Icon name="plus" size={18} />Tambah toko / cabang</button>

      {adding && (
        <Sheet label="Tambah toko" onClose={() => setAdding(false)}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><IconTile name="store" /><h2 className="h2" style={{ fontSize: 19 }}>Tambah toko / cabang</h2></div>
          <p className="hint">Setiap toko mendapat QRIS sendiri. Data pemilik (e-KTP dan selfie) dipakai lagi, jadi Anda cukup mengisi data toko baru, foto toko dan rekening pencairannya.</p>
          <div role="radiogroup" aria-label="Produk" style={{ display: 'flex', gap: 10 }}>
            {([['QRIS', 'qris', 'QRIS saja', 'Gratis'], ['SOUNDBOX', 'speaker', 'Soundbox QRIS', 'Rp349.000']] as const).map(([v, ic, t, p]) => (
              <button key={v} type="button" role="radio" aria-checked={product === v} className="choice" onClick={() => setProduct(v)}>
                <Icon name={ic} size={22} color={product === v ? 'var(--blue)' : 'var(--muted)'} /><strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{p}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => start(() => addOutlet(product))}>{pending ? 'Menyiapkan…' : 'Lanjut isi data toko'}</button>
        </Sheet>
      )}
    </main>
  );
}
