'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import MoneyInput from '@/components/MoneyInput';
import { rp, todayISO } from '@/lib/invoice';
import { Sheet, useToast } from '../../Sheets';
import { deleteProduct, saveInvoiceCode, saveProduct } from '../actions';
import type { Product } from '../InvoiceEditor';

export default function ProductsClient({ products, code: initialCode }: { products: Product[]; code: string }) {
  const router = useRouter();
  const [edit, setEdit] = useState<null | { id?: string; name: string; price: number }>(null);
  const [q, setQ] = useState('');
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const [toast, setToast] = useToast();
  const query = q.trim().toLowerCase();
  const shown = query ? products.filter((p) => p.name.toLowerCase().includes(query)) : products;

  function save() {
    if (!edit) return;
    setError('');
    start(async () => {
      const r = await saveProduct({ name: edit.name, price: edit.price }, edit.id);
      if (!r.ok) return setError(r.error);
      setEdit(null); setToast('Produk tersimpan'); router.refresh();
    });
  }

  return (
    <main className="app-sheet inner">
      <section className="card" style={{ gap: 10 }}>
        <strong style={{ fontSize: 15 }}>Kode invoice</strong>
        <span className="hint">Dipakai di nomor invoice, contoh: INV-{code || 'KODE'}-{todayISO().slice(2).replace(/-/g, '')}-001</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} aria-label="Kode invoice" />
          <button type="button" className="btn btn-ghost" disabled={pending || code === initialCode}
            onClick={() => start(async () => { const r = await saveInvoiceCode(code); setToast(r.ok ? 'Kode invoice tersimpan' : r.error); if (r.ok) router.refresh(); })}>Simpan</button>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="h2">Daftar produk ({products.length})</h2>
        <button type="button" className="btn btn-primary" style={{ minHeight: 40, gap: 6 }} onClick={() => setEdit({ name: '', price: 0 })}><Icon name="plus" size={18} />Tambah</button>
      </div>
      {products.length > 5 && (
        <label className="search-pill"><Icon name="search" size={18} color="var(--muted)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk" aria-label="Cari produk" /></label>
      )}
      {products.length === 0 ? (
        <div className="empty-card"><Icon name="box" size={28} color="var(--blue)" /><strong>Belum ada produk</strong><span className="hint">Simpan barang yang sering dijual supaya membuat invoice lebih cepat.</span></div>
      ) : (
        <section className="card" style={{ padding: '4px 16px', gap: 0 }}>
          {shown.map((p) => (
            <button key={p.id} type="button" className="line-item tap" onClick={() => setEdit(p)} style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', font: 'inherit' }}>
              <span style={{ flex: 1 }}><strong style={{ fontSize: 14 }}>{p.name}</strong></span>
              <span style={{ fontWeight: 700 }}>{rp(p.price)}</span>
              <Icon name="chevron" size={18} color="var(--muted)" />
            </button>
          ))}
        </section>
      )}

      {edit && (
        <Sheet label={edit.id ? 'Ubah produk' : 'Tambah produk'} onClose={() => setEdit(null)}>
          <h2 className="h2" style={{ fontSize: 19 }}>{edit.id ? 'Ubah produk' : 'Tambah produk'}</h2>
          <label className="field">Nama produk<input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus /></label>
          <label className="field">Harga<MoneyInput value={edit.price} onChange={(n) => setEdit({ ...edit, price: n })} label="Harga" /></label>
          {error && <p className="err" role="alert">{error}</p>}
          <button type="button" className="btn btn-primary" disabled={pending} onClick={save}>{pending ? 'Menyimpan…' : 'Simpan'}</button>
          {edit.id && <button type="button" className="btn btn-ghost" style={{ color: 'var(--err)' }} disabled={pending}
            onClick={() => start(async () => { await deleteProduct(edit.id!); setEdit(null); setToast('Produk dihapus'); router.refresh(); })}>Hapus produk</button>}
        </Sheet>
      )}
      {toast}
    </main>
  );
}
