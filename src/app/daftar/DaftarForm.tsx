'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { MARKETPLACES } from '@/lib/provinces';
import { suggestEmail } from '@/lib/rules';
import { createAccount, type FormState } from './actions';

type SbStatus = 'beli' | 'market' | 'sales' | 'sampai';

const SB_OPTS: Array<[SbStatus, string]> = [
  ['beli', 'Belum beli'],
  ['market', 'Sudah pesan di marketplace'],
  ['sales', 'Dari sales'],
  ['sampai', 'Sudah sampai']
];

const SB_HINT: Record<SbStatus, string> = {
  beli: 'Bayar Rp349.000 di aplikasi setelah pendaftaran terkirim.',
  market: 'Tidak perlu bayar lagi. Admin mencocokkan No. Pesanan Anda.',
  sales: 'Tidak perlu bayar lagi. Isi nama sales HausJo.',
  sampai: 'Setelah daftar, pindai barcode SN Soundbox di aplikasi. CS akan memandu aktivasi.'
};

export default function DaftarForm({ initialProduct }: { initialProduct: 'soundbox' | 'qris' }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createAccount, { error: null });
  const [product, setProduct] = useState(initialProduct);
  const [sb, setSb] = useState<SbStatus>('beli');
  const [market, setMarket] = useState(MARKETPLACES[0]);
  const [email, setEmail] = useState('');
  const fix = suggestEmail(email);

  return (
    <form action={action} className="content screen-in">
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Daftar merchant</h1>
        <p className="hint" style={{ marginTop: 6, fontSize: 13.5 }}>Pilih yang ingin Anda daftarkan.</p>
      </div>

      <input type="hidden" name="product" value={product} />
      <input type="hidden" name="sbStatus" value={sb} />
      <input type="hidden" name="marketplace" value={market} />

      <div style={{ display: 'flex', gap: 10 }} role="radiogroup" aria-label="Jenis pendaftaran">
        {([['soundbox', 'Soundbox QRIS', 'Rp349.000', 'QRIS + Soundbox'], ['qris', 'QRIS saja', 'Gratis', 'Stiker QRIS, tanpa Soundbox']] as const).map(
          ([id, name, price, desc]) => (
            <button key={id} type="button" role="radio" aria-checked={product === id} className="choice" onClick={() => setProduct(id)}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{price}</span>
              <span className="hint">{desc}</span>
            </button>
          )
        )}
      </div>

      {product === 'soundbox' && (
        <div className="card" style={{ gap: 10, padding: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Soundbox Anda</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SB_OPTS.map(([id, label]) => (
              <button key={id} type="button" className="chip" aria-pressed={sb === id} onClick={() => setSb(id)}>{label}</button>
            ))}
          </div>
          <p className="hint">{SB_HINT[sb]}</p>
          {sb === 'market' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MARKETPLACES.map((m) => (
                  <button key={m} type="button" className="chip" aria-pressed={market === m} onClick={() => setMarket(m)}>{m}</button>
                ))}
              </div>
              <label className="field">No. Pesanan<input className="input" name="orderNo" placeholder="Contoh: 2611017AB3CD9Z" /></label>
            </>
          )}
          {sb === 'sales' && (
            <label className="field">Nama sales HausJo<input className="input" name="salesName" placeholder="Nama sales yang mendatangi Anda" /></label>
          )}
        </div>
      )}

      <label className="field">Nomor WhatsApp
        <input className="input" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="08xx xxxx xxxx" required />
      </label>
      <label className="field">Email
        <input className="input" name="email" type="email" autoComplete="email" placeholder="nama@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {fix && (
          <span className="err">
            Maksud Anda{' '}
            <button type="button" onClick={() => setEmail(fix)} style={{ color: 'var(--blue)', background: 'none', border: 0, padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>{fix}</button>?
          </span>
        )}
      </label>
      <label className="field">Buat kata sandi
        <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="Minimal 8 karakter" required />
      </label>
      <label className="field">Kode referral <span style={{ fontWeight: 500, color: 'var(--muted)' }}>(opsional)</span>
        <input className="input" name="referral" placeholder="Dari agen atau sales HausJo" />
      </label>

      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>{pending ? 'Membuat akun…' : 'Daftar'}</button>
      <p className="hint">Sudah punya akun? <Link href="/masuk" style={{ fontWeight: 700 }}>Masuk</Link></p>
    </form>
  );
}
