'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import Icon from '@/components/Icon';
import { suggestEmail } from '@/lib/rules';
import { createAccount, type FormState } from './actions';

export default function DaftarForm({ initialProduct }: { initialProduct: 'soundbox' | 'qris' }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createAccount, { error: null });
  const [product, setProduct] = useState(initialProduct);
  const [email, setEmail] = useState('');
  const fix = suggestEmail(email);

  return (
    <form action={action} className="content screen-in">
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Daftar merchant</h1>
        <p className="hint" style={{ marginTop: 6, fontSize: 13.5 }}>Pilih yang ingin Anda daftarkan.</p>
      </div>

      <input type="hidden" name="product" value={product} />

      <div style={{ display: 'flex', gap: 10 }} role="radiogroup" aria-label="Jenis pendaftaran">
        {([['soundbox', 'Soundbox QRIS', 'Rp349.000', 'QRIS + Soundbox'], ['qris', 'QRIS saja', 'Gratis', 'Stiker QRIS, tanpa Soundbox']] as const).map(
          ([id, name, price, desc]) => (
            <button key={id} type="button" role="radio" aria-checked={product === id} className="choice" onClick={() => setProduct(id)}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Icon name={id === 'soundbox' ? 'speaker' : 'qris'} color={product === id ? 'var(--blue)' : 'var(--muted)'} />
                <span aria-hidden="true" className={product === id ? 'task-dot done' : ''} style={{ width: 22, height: 22, fontSize: 12, borderRadius: '50%', border: product === id ? 0 : '2px solid #c9d3e3', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{product === id ? '✓' : ''}</span>
              </span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{price}</span>
              <span className="hint">{desc}</span>
            </button>
          )
        )}
      </div>

      {product === 'soundbox' && (
        <p className="note fade-in" style={{ margin: 0 }}>Sudah beli Soundbox di marketplace, lewat sales, atau Soundbox sudah sampai? Pilih di aplikasi setelah daftar, tidak perlu bayar lagi.</p>
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
