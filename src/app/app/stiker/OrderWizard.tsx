'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { EdcHero, ProductThumb, StickerHero } from '@/components/StickerArt';
import { ADDRESS_LABELS, KIND_PATH, SHIPPING_FEE, TIME_SLOTS, feeText, packagesOf, priceOrder, rp, type Kind } from '@/lib/sticker';
import RegionPicker from '../../daftar/langkah/RegionPicker';
import { Sheet } from '../Sheets';
import { placeOrder, saveAddress, type AddressInput, type SavedAddress } from './actions';

type Step = 'paket' | 'alamat' | 'form' | 'konfirmasi';
const TITLE: Record<Step, string> = { paket: '', alamat: 'Alamat pengiriman', form: 'Isi alamat pengiriman', konfirmasi: 'Konfirmasi pesanan' };
const TEXT: Record<Kind, { title: string; pick: string; unit: string; note: string; what: string; after: string }> = {
  STIKER: {
    title: 'Pesan stiker QRIS', pick: 'Pilih paket yang diinginkan', unit: 'paket',
    note: 'Stiker dicetak dengan QRIS toko ini. Untuk toko lain, ganti toko dulu di menu Toko saya.',
    what: 'Stiker QRIS cetak dengan nama toko dan NMID Anda, siap ditempel di kasir. Paket Akrilik sudah termasuk stand akrilik untuk meja kasir.',
    after: 'Stiker dicetak setelah pembayaran diterima, lalu dikirim dalam 2–5 hari kerja.'
  },
  EDC: {
    title: 'Beli EDC', pick: 'Pilih mesin EDC', unit: 'unit',
    note: 'EDC disiapkan untuk toko ini. Untuk toko lain, ganti toko dulu di menu Toko saya.',
    what: 'PAX A620 untuk pembayaran QRIS dinamis: nominal muncul langsung di layar, pembeli tinggal scan. PAX A920 Pro menerima kartu debit, kartu kredit dan QRIS. CS AIPOS memandu aktivasi setelah mesin sampai.',
    after: 'EDC disiapkan setelah pembayaran diterima, lalu dikirim ke alamat Anda.'
  }
};

const oneLine = (a: AddressInput) => [a.address, a.kelurahan, a.kecamatan, a.city, a.province, a.postalCode].filter(Boolean).join(', ');
const strike = { textDecoration: 'line-through', color: 'var(--muted)', fontSize: 12.5 } as const;

export default function OrderWizard({ kind, store, saved, blank }: { kind: Kind; store: { name: string; area: string }; saved: SavedAddress[]; blank: AddressInput }) {
  const T = TEXT[kind];
  const packages = packagesOf(kind);
  const router = useRouter();
  const [step, setStep] = useState<Step>('paket');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [list, setList] = useState(saved);
  const [addrId, setAddrId] = useState(saved[0]?.id ?? '');
  const [form, setForm] = useState<AddressInput & { id?: string }>(blank);
  const [slot, setSlot] = useState('');
  const [check, setCheck] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const t = priceOrder(qty, kind);
  const addr = list.find((a) => a.id === addrId);
  const set = (code: string, n: number) => setQty((q) => ({ ...q, [code]: Math.max(0, Math.min(packages.find((p) => p.code === code)!.max, n)) }));
  const go = (s: Step) => { setError(''); setStep(s); window.scrollTo({ top: 0 }); };
  const back = () => go(step === 'konfirmasi' ? 'alamat' : step === 'form' && list.length ? 'alamat' : 'paket');
  const openForm = (a?: SavedAddress) => { setForm(a ? { ...a } : { ...blank, label: list.some((x) => x.label === 'Toko') ? 'Rumah' : blank.label }); go('form'); };

  function saveForm() {
    setError('');
    start(async () => {
      const { id, ...data } = form;
      const r = await saveAddress(data, id);
      if (!r.ok || !r.data) return setError(r.ok ? 'Gagal menyimpan' : r.error);
      const a = r.data;
      setList((l) => (id ? l.map((x) => (x.id === id ? a : x)) : [a, ...l]));
      setAddrId(a.id);
      setStep('alamat');
      setCheck(true);
    });
  }

  function submit() {
    setError('');
    start(async () => {
      const r = await placeOrder({ kind, qty, addressId: addrId, timeSlot: slot || undefined });
      if (!r.ok) return setError(r.error);
      router.push(`${KIND_PATH[kind]}/${r.data}?baru=1`);
    });
  }

  const next = () => {
    if (step === 'paket') return list.length ? go('alamat') : openForm();
    if (step === 'alamat') return addr ? setCheck(true) : setError('Pilih alamat terlebih dahulu');
    if (step === 'form') return saveForm();
    submit();
  };

  return (
    <>
      <div className="page-top">
        <div className="page-top-row">
          {step === 'paket'
            ? <Link href={KIND_PATH[kind]} aria-label="Kembali" className="back"><Icon name="arrowLeft" size={22} /></Link>
            : <button type="button" onClick={back} aria-label="Kembali" className="back" style={{ background: 'none', border: 0, cursor: 'pointer' }}><Icon name="arrowLeft" size={22} /></button>}
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h1>{TITLE[step] || T.title}</h1>
            <span style={{ fontSize: 12.5, color: '#dbe8ff' }}>Untuk {store.name}</span>
          </span>
        </div>
        <div className="steps-bar" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= ({ paket: 0, alamat: 1, form: 1, konfirmasi: 2 } as const)[step] ? 'on' : ''} />)}</div>
      </div>

      <main className="app-sheet inner">
        {step === 'paket' && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden' }}>{kind === 'EDC' ? <EdcHero /> : <StickerHero />}</div>
            <section className="card" style={{ gap: 14 }}>
              <strong style={{ fontSize: 16 }}>{T.pick}</strong>
              <p className="note" style={{ margin: 0, fontSize: 13, background: 'var(--warn-soft)', border: '1px solid #f7c98b', borderRadius: 12, padding: '10px 12px' }}>
                Pesanan ini untuk satu toko: <b>{store.name}</b>. {T.note}
              </p>
              {packages.map((p) => {
                const n = qty[p.code] ?? 0;
                return (
                  <div key={p.code} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--tile)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ProductThumb code={p.code} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong style={{ fontSize: 15 }}>{p.name}</strong>
                      <span style={{ fontSize: 13 }}>{p.desc}</span>
                      <span style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>{p.normalPrice > p.price && <span style={strike}>{rp(p.normalPrice)}</span>}<strong style={{ fontSize: 14 }}>{rp(p.price)}</strong></span>
                    </span>
                    {n === 0
                      ? <button type="button" className="btn btn-ghost" style={{ minHeight: 40, padding: '0 18px', borderRadius: 999 }} onClick={() => set(p.code, 1)} aria-label={`Tambah ${p.name}`}>Tambah</button>
                      : <span className="qty">
                          <button type="button" onClick={() => set(p.code, n - 1)} aria-label={`Kurangi ${p.name}`}>−</button>
                          <span aria-live="polite">{n}</span>
                          <button type="button" onClick={() => set(p.code, n + 1)} aria-label={`Tambah ${p.name}`} disabled={n >= p.max}>+</button>
                        </span>}
                  </div>
                );
              })}
            </section>
            <section className="card" style={{ gap: 8 }}>
              <strong style={{ fontSize: 14 }}>Yang Anda terima</strong>
              <span className="hint">{T.what} Ongkos kirim: {feeText(SHIPPING_FEE[kind])}{SHIPPING_FEE[kind] ? ' per pesanan' : ''}.</span>
            </section>
          </div>
        )}

        {step === 'alamat' && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="card" style={{ gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>Pilih alamat</strong>
                <button type="button" onClick={() => openForm()} style={{ background: 'none', border: 0, color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: 14, minHeight: 44 }}>+ Alamat baru</button>
              </div>
              <div role="radiogroup" aria-label="Alamat pengiriman" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {list.map((a) => (
                  <div key={a.id} role="radio" aria-checked={a.id === addrId} tabIndex={0} className="choice"
                    onClick={() => setAddrId(a.id)} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAddrId(a.id); } }}
                    style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <Icon name={a.label === 'Toko' ? 'store' : a.label === 'Rumah' ? 'home' : 'pin'} size={20} color="var(--blue)" />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                      <strong style={{ fontSize: 14 }}>{a.label}</strong>
                      <strong>{a.recipient}</strong>
                      <span>{a.phone}</span>
                      <span className="hint">{oneLine(a)}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openForm(a); }} style={{ alignSelf: 'flex-start', background: 'none', border: 0, padding: '6px 0 0', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Ubah alamat</button>
                    </span>
                    <span className={`radio-dot${a.id === addrId ? ' on' : ''}`} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </section>
            <section className="card" style={{ gap: 10 }}>
              <strong style={{ fontSize: 14 }}>Waktu pengiriman <span className="hint" style={{ fontWeight: 500 }}>(opsional)</span></strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TIME_SLOTS.map((s) => <button key={s} type="button" className="chip" aria-pressed={slot === s} onClick={() => setSlot(slot === s ? '' : s)}>{s}</button>)}
              </div>
              <span className="hint">Kurir berusaha datang di jam ini, tapi tidak dijamin.</span>
            </section>
          </div>
        )}

        {step === 'form' && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="card" style={{ gap: 12 }}>
              <label className="field">Label alamat
                <input className="input" value={form.label} maxLength={30} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Contoh: Toko" />
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: -4 }}>
                {ADDRESS_LABELS.map((l) => <button key={l} type="button" className="chip" style={{ minHeight: 36, padding: '6px 12px' }} aria-pressed={form.label === l} onClick={() => setForm({ ...form, label: l })}>{l}</button>)}
              </div>
              <label className="field">Nama penerima
                <input className="input" value={form.recipient} maxLength={60} autoComplete="name" onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
              </label>
              <label className="field">Nomor HP penerima
                <input className="input" value={form.phone} inputMode="tel" autoComplete="tel" maxLength={16} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+]/g, '') })} placeholder="08…" />
              </label>
            </section>
            <section className="card" style={{ gap: 12 }}>
              <RegionPicker value={{ province: form.province, city: form.city, kecamatan: form.kecamatan, kelurahan: form.kelurahan, postalCode: form.postalCode, villageCode: form.villageCode ?? '' }}
                onChange={(v) => setForm((f) => ({ ...f, ...v }))} />
              <label className="field">Alamat pengiriman
                <textarea className="input" rows={3} value={form.address} maxLength={250} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Nama jalan, gedung, nomor rumah/toko, RT/RW" />
              </label>
              <label className="field">Catatan untuk kurir <span className="hint" style={{ fontWeight: 500 }}>(opsional)</span>
                <input className="input" value={form.courierNote ?? ''} maxLength={120} onChange={(e) => setForm({ ...form, courierNote: e.target.value })} placeholder="Patokan, ciri lokasi, atau pesan lain" />
              </label>
            </section>
          </div>
        )}

        {step === 'konfirmasi' && addr && (
          <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="note" style={{ margin: 0, fontSize: 13, display: 'flex', gap: 8, background: 'var(--blue-soft)', borderRadius: 12, padding: '10px 12px' }}>
              <Icon name="truck" size={18} color="var(--blue)" />{T.after}
            </p>
            <section className="card" style={{ gap: 4 }}>
              <strong style={{ fontSize: 15, marginBottom: 6 }}>Detail pesanan</strong>
              {t.items.map((i) => (
                <div key={i.code} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0' }}>
                  <ProductThumb code={i.code} size={40} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: 13 }}><strong style={{ fontSize: 14 }}>{i.name}</strong><span className="hint">{i.qty} × {rp(i.price)}</span></span>
                  <strong style={{ fontSize: 14 }}>{rp(i.price * i.qty)}</strong>
                </div>
              ))}
              <div className="sum-row" style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 10 }}><span>Toko</span><strong>{store.name}</strong></div>
            </section>
            <section className="card" style={{ gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>Detail pengiriman</strong>
                <button type="button" onClick={() => go('alamat')} aria-label="Ubah alamat" className="icon-btn" style={{ background: 'var(--tile)', border: 0, borderRadius: 10, width: 36, height: 36, color: 'var(--blue)', cursor: 'pointer' }}><Icon name="arrowRight" size={16} /></button>
              </div>
              <span style={{ fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong>{addr.recipient} · {addr.phone}</strong>
                <span>{oneLine(addr)}</span>
                {slot && <span className="hint">Dikirim jam {slot}</span>}
                {addr.courierNote && <span className="hint">Catatan: {addr.courierNote}</span>}
              </span>
            </section>
            <section className="card" style={{ gap: 0 }}>
              <strong style={{ fontSize: 15, marginBottom: 6 }}>Ringkasan belanja</strong>
              <div className="sum-row"><span>Pesanan</span><span>{t.normalTotal > t.subtotal && <span style={strike}>{rp(t.normalTotal)}</span>} {rp(t.subtotal)}</span></div>
              <div className="sum-row"><span>Biaya pengiriman</span><span>{feeText(t.shippingFee)}</span></div>
              <div className="sum-row total"><span>Total pembayaran</span><span>{rp(t.total)}</span></div>
              {t.savings > 0 && <div className="sum-row" style={{ background: 'var(--ok-soft)', color: 'var(--ok)', fontWeight: 700, borderRadius: 10, padding: '10px 12px', marginTop: 10 }}><span>Penghematan</span><span>{rp(t.savings)}</span></div>}
            </section>
            <p className="hint" style={{ margin: 0 }}>Setelah pesanan dibuat, tim AIPOS mengirim link pembayaran (QRIS, transfer bank atau e-wallet) ke WhatsApp Anda di jam kerja. Dengan memesan, Anda menyetujui <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>.</p>
          </div>
        )}

        {error && <p className="err" role="alert">{error}</p>}
        <div className="bottom-bar">
          {step !== 'form' && t.items.length > 0 && (
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span className="hint">{step === 'konfirmasi' ? 'Total' : `${t.items.reduce((s, i) => s + i.qty, 0)} ${T.unit}`}</span>
              <strong style={{ fontSize: 17 }}>{rp(step === 'konfirmasi' ? t.total : t.subtotal)}</strong>
            </span>
          )}
          <button type="button" className="btn btn-primary" onClick={next} disabled={pending || !t.items.length} style={{ minWidth: 150, flex: step === 'form' ? 1 : undefined }}>
            {pending ? 'Memproses…' : step === 'form' ? 'Simpan alamat' : step === 'konfirmasi' ? 'Buat pesanan' : 'Lanjut'}
          </button>
        </div>
      </main>

      {check && addr && (
        <Sheet label="Cek alamat" onClose={() => setCheck(false)}>
          <h2 className="h2" style={{ fontSize: 19 }}>Cek kembali alamat tujuan pengirimannya, ya</h2>
          <div className="card" style={{ gap: 4, fontSize: 13.5, background: 'var(--ground)' }}>
            <strong style={{ fontSize: 15 }}>{addr.recipient}</strong>
            <span>{addr.phone}</span>
            <span>{oneLine(addr)}</span>
            {slot && <span className="hint">Dikirim jam {slot}</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setCheck(false); openForm(addr); }}>Ubah</button>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setCheck(false); go('konfirmasi'); }}>Ya, sudah benar</button>
          </div>
        </Sheet>
      )}
    </>
  );
}
