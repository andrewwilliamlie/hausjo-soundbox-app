'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import MoneyInput from '@/components/MoneyInput';
import { rp, todayISO, totals, type InvoiceInput, type InvoiceItem } from '@/lib/invoice';
import { saveInvoice, saveProduct } from './actions';

export type Product = { id: string; name: string; price: number };

const blank: InvoiceInput = {
  customerName: '', customerPhone: '', orderDate: todayISO(), note: '', items: [],
  deliveryType: 'ambil', deliveryAddress: '', deliveryFee: 0, discountType: 'rp', discountValue: 0, taxPct: 0
};
const STEP_TITLE = ['Pesanan', 'Pelanggan', 'Ringkasan'];

/** Create or edit an invoice in 3 steps: items, customer & delivery, then discount/tax and totals. */
export default function InvoiceEditor({ products: initialProducts, initial, editId, number }: { products: Product[]; initial?: InvoiceInput; editId?: string; number?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<InvoiceInput>(initial ?? blank);
  const [products, setProducts] = useState(initialProducts);
  const [pq, setPq] = useState('');
  const [adding, setAdding] = useState(initialProducts.length === 0);
  const [np, setNp] = useState({ name: '', price: 0, keep: true });
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const t = totals(d);
  const set = <K extends keyof InvoiceInput>(k: K, v: InvoiceInput[K]) => setD((x) => ({ ...x, [k]: v }));

  function addItem(it: InvoiceItem) {
    setD((x) => {
      const i = x.items.findIndex((y) => (it.productId ? y.productId === it.productId : false));
      if (i >= 0) return { ...x, items: x.items.map((y, j) => (j === i ? { ...y, qty: y.qty + 1 } : y)) };
      return { ...x, items: [...x.items, it] };
    });
  }
  const qty = (i: number, delta: number) => setD((x) => ({ ...x, items: x.items.flatMap((y, j) => (j !== i ? [y] : y.qty + delta <= 0 ? [] : [{ ...y, qty: y.qty + delta }])) }));

  function addNew() {
    setError('');
    if (!np.name.trim()) return setError('Isi nama barang');
    if (np.keep) {
      start(async () => {
        const r = await saveProduct({ name: np.name, price: np.price });
        if (!r.ok) return setError(r.error);
        setProducts((p) => [...p, r.data!].sort((a, b) => a.name.localeCompare(b.name)));
        addItem({ productId: r.data!.id, name: r.data!.name, price: r.data!.price, qty: 1 });
        setNp({ name: '', price: 0, keep: true });
        setAdding(false);
      });
    } else {
      addItem({ productId: null, name: np.name.trim(), price: np.price, qty: 1 });
      setNp({ name: '', price: 0, keep: true });
      setAdding(false);
    }
  }

  function next() {
    setError('');
    if (step === 0 && !d.items.length) return setError('Tambahkan minimal 1 barang');
    if (step === 1) {
      if (!d.customerName.trim()) return setError('Isi nama pelanggan');
      if (d.deliveryType === 'kirim' && !d.deliveryAddress.trim()) return setError('Isi alamat pengiriman');
    }
    if (step < 2) { setStep(step + 1); window.scrollTo({ top: 0 }); return; }
    start(async () => {
      const r = await saveInvoice(d, editId);
      if (!r.ok) return setError(r.error);
      router.push(`/app/invoice/${r.data}/bagikan?${editId ? 'ubah' : 'baru'}=1`);
    });
  }

  const q = pq.trim().toLowerCase();
  const found = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;

  return (
    <>
      <div className="page-top">
        <div className="page-top-row">
          {step === 0
            ? <Link href={editId ? `/app/invoice/${editId}` : '/app/invoice'} aria-label="Batal" className="back"><Icon name="arrowLeft" size={22} /></Link>
            : <button type="button" onClick={() => setStep(step - 1)} aria-label="Kembali" className="back" style={{ background: 'none', border: 0, cursor: 'pointer' }}><Icon name="arrowLeft" size={22} /></button>}
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <h1>{editId ? `Ubah ${number}` : 'Buat invoice'}</h1>
            <span style={{ fontSize: 12.5, color: '#dbe8ff' }}>Langkah {step + 1} dari 3 · {STEP_TITLE[step]}</span>
          </span>
        </div>
        <div className="steps-bar" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
      </div>

      <main className="app-sheet inner">
        {step === 0 && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {d.items.length > 0 && (
              <section className="card" style={{ padding: '4px 16px', gap: 0 }}>
                {d.items.map((it, i) => (
                  <div key={i} className="line-item">
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong style={{ fontSize: 14 }}>{it.name}</strong>
                      <span className="hint">{rp(it.price)} · {rp(it.price * it.qty)}</span>
                    </span>
                    <span className="qty">
                      <button type="button" onClick={() => qty(i, -1)} aria-label={`Kurangi ${it.name}`}>−</button>
                      <span aria-live="polite">{it.qty}</span>
                      <button type="button" onClick={() => qty(i, 1)} aria-label={`Tambah ${it.name}`}>+</button>
                    </span>
                  </div>
                ))}
                <div className="sum-row" style={{ padding: '12px 0' }}><span>{t.count} barang</span><strong>{rp(t.subtotal)}</strong></div>
              </section>
            )}

            <section className="card" style={{ gap: 12 }}>
              <strong style={{ fontSize: 15 }}>Pilih barang</strong>
              {products.length > 0 && (
                <>
                  <label className="search-pill" style={{ minHeight: 42 }}>
                    <Icon name="search" size={18} color="var(--muted)" />
                    <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Cari produk" aria-label="Cari produk" />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 280, overflowY: 'auto' }}>
                    {found.map((p) => {
                      const inCart = d.items.find((x) => x.productId === p.id)?.qty ?? 0;
                      return (
                        <button key={p.id} type="button" className="line-item tap" onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, qty: 1 })}
                          style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', cursor: 'pointer', textAlign: 'left', color: 'var(--ink)', font: 'inherit' }}>
                          <span style={{ flex: 1 }}><strong style={{ fontSize: 14 }}>{p.name}</strong><br /><span className="hint">{rp(p.price)}</span></span>
                          {inCart > 0 && <span className="tag ok">{inCart} dipilih</span>}
                          <span className="tile-icon" style={{ width: 34, height: 34, borderRadius: 10 }}><Icon name="plus" size={18} /></span>
                        </button>
                      );
                    })}
                    {found.length === 0 && <span className="hint">Produk tidak ditemukan.</span>}
                  </div>
                </>
              )}
              {adding ? (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--ground)', borderRadius: 12, padding: 12 }}>
                  <label className="field">Nama barang<input className="input" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="Contoh: Nasi box ayam" autoFocus /></label>
                  <label className="field">Harga<MoneyInput value={np.price} onChange={(n) => setNp({ ...np, price: n })} label="Harga" /></label>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}><input type="checkbox" checked={np.keep} onChange={(e) => setNp({ ...np, keep: e.target.checked })} style={{ width: 20, height: 20 }} />Simpan ke daftar produk</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {products.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Batal</button>}
                    <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={addNew} disabled={pending}>Tambahkan</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => setAdding(true)} style={{ gap: 6 }}><Icon name="plus" size={18} />Barang baru</button>
              )}
            </section>
          </div>
        )}

        {step === 1 && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="card" style={{ gap: 12 }}>
              <label className="field">Nama pelanggan<input className="input" value={d.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="Contoh: Ibu Sari" autoFocus /></label>
              <label className="field">Nomor WhatsApp pelanggan <span style={{ fontWeight: 500, color: 'var(--muted)' }}>(untuk kirim invoice)</span>
                <input className="input" type="tel" inputMode="numeric" value={d.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="08xx xxxx xxxx" />
              </label>
              <label className="field">Tanggal pesanan<input className="input" type="date" value={d.orderDate} onChange={(e) => set('orderDate', e.target.value)} /></label>
            </section>
            <section className="card" style={{ gap: 12 }}>
              <strong style={{ fontSize: 15 }}>Pengiriman</strong>
              <div role="radiogroup" aria-label="Pengiriman" style={{ display: 'flex', gap: 10 }}>
                {([['ambil', 'store', 'Diambil', 'Pelanggan ambil sendiri'], ['kirim', 'truck', 'Dikirim', 'Ke alamat pelanggan']] as const).map(([v, ic, l, s]) => (
                  <button key={v} type="button" role="radio" aria-checked={d.deliveryType === v} className="choice" onClick={() => set('deliveryType', v)}>
                    <Icon name={ic} size={22} color={d.deliveryType === v ? 'var(--blue)' : 'var(--muted)'} /><strong style={{ fontSize: 14 }}>{l}</strong><span className="hint">{s}</span>
                  </button>
                ))}
              </div>
              {d.deliveryType === 'kirim' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="field">Alamat pengiriman<textarea className="input" rows={3} value={d.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} /></label>
                  <label className="field">Ongkos kirim<MoneyInput value={d.deliveryFee} onChange={(n) => set('deliveryFee', n)} label="Ongkos kirim" /></label>
                </div>
              )}
              <label className="field">Catatan <span style={{ fontWeight: 500, color: 'var(--muted)' }}>(opsional)</span>
                <textarea className="input" rows={2} value={d.note} onChange={(e) => set('note', e.target.value)} placeholder="Contoh: Diambil jam 5 sore" />
              </label>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="card" style={{ gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>{d.customerName}</strong>
                <button type="button" onClick={() => setStep(1)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 0, cursor: 'pointer', minHeight: 40 }}>Ubah</button>
              </div>
              <span className="hint">{d.customerPhone || 'Tanpa nomor WhatsApp'} · {d.deliveryType === 'kirim' ? 'Dikirim' : 'Diambil'}</span>
            </section>
            <section className="card" style={{ gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>Pesanan</strong>
                <button type="button" onClick={() => setStep(0)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 0, cursor: 'pointer', minHeight: 40 }}>Ubah</button>
              </div>
              {d.items.map((it, i) => <div key={i} className="sum-row"><span>{it.name} × {it.qty}</span><span>{rp(it.price * it.qty)}</span></div>)}
            </section>
            <section className="card" style={{ gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Diskon</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="seg-mini" role="radiogroup" aria-label="Jenis diskon">
                  {(['rp', 'pct'] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={d.discountType === k} onClick={() => setD((x) => ({ ...x, discountType: k, discountValue: 0 }))}>{k === 'rp' ? 'Rp' : '%'}</button>)}
                </span>
                <span style={{ flex: 1 }}>
                  {d.discountType === 'rp'
                    ? <MoneyInput value={d.discountValue} onChange={(n) => set('discountValue', n)} label="Diskon rupiah" />
                    : <MoneyInput prefix="%" value={d.discountValue} onChange={(n) => set('discountValue', Math.min(100, n))} label="Diskon persen" />}
                </span>
              </div>
              <label className="field">Pajak (%)<MoneyInput prefix="%" value={d.taxPct} onChange={(n) => set('taxPct', Math.min(100, n))} label="Pajak persen" /></label>
            </section>
            <section className="card" style={{ gap: 0 }}>
              <div className="sum-row"><span>Subtotal ({t.count} barang)</span><span>{rp(t.subtotal)}</span></div>
              {t.discount > 0 && <div className="sum-row"><span>Diskon</span><span style={{ color: 'var(--ok)' }}>−{rp(t.discount)}</span></div>}
              {t.tax > 0 && <div className="sum-row"><span>Pajak ({d.taxPct}%)</span><span>{rp(t.tax)}</span></div>}
              {d.deliveryType === 'kirim' && <div className="sum-row"><span>Ongkos kirim</span><span>{rp(t.fee)}</span></div>}
              <div className="sum-row total"><span>Total</span><span>{rp(t.total)}</span></div>
            </section>
          </div>
        )}

        {error && <p className="err" role="alert">{error}</p>}
        <div className="bottom-bar">
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className="hint">Total</span><strong style={{ fontSize: 17 }}>{rp(t.total)}</strong>
          </span>
          <button type="button" className="btn btn-primary" onClick={next} disabled={pending} style={{ minWidth: 150 }}>
            {pending ? 'Menyimpan…' : step < 2 ? 'Lanjut' : editId ? 'Simpan perubahan' : 'Buat invoice'}
          </button>
        </div>
      </main>
    </>
  );
}
