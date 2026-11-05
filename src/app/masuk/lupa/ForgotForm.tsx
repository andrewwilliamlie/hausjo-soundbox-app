'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import Icon, { IconTile } from '@/components/Icon';
import { requestReset, type ForgotState } from '../reset-actions';

export default function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestReset, { error: null });
  if (state.sent) {
    return (
      <div className="content screen-in" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
        <span className="pop"><IconTile name="checkCircle" tone="green" size={72} /></span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Cek email Anda</h1>
        <p className="hint" style={{ fontSize: 14 }}>Jika nomor atau email itu terdaftar, link untuk membuat PIN baru sudah kami kirim ke email akun. Link berlaku 1 jam. Cek juga folder Spam.</p>
        <p className="hint">Tidak bisa membuka email? Hubungi CS AIPOS, admin bisa mengirim link lewat WhatsApp.</p>
        <Link href="/masuk?form=1" className="btn btn-ghost btn-block">Kembali ke Masuk</Link>
      </div>
    );
  }
  return (
    <form action={action} className="content screen-in">
      <IconTile name="lock" size={52} />
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Lupa PIN</h1>
      <p className="hint" style={{ fontSize: 13.5 }}>Masukkan nomor WhatsApp atau email yang dipakai saat daftar. Kami kirim link untuk membuat PIN baru ke email Anda.</p>
      <label className="field">Nomor WhatsApp atau email<input className="input" name="id" autoComplete="username" required /></label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending} style={{ gap: 8 }}>{pending ? 'Mengirim…' : <>Kirim link <Icon name="chevron" size={18} /></>}</button>
      <p className="hint"><Link href="/masuk?form=1" style={{ fontWeight: 700 }}>Kembali ke Masuk</Link></p>
    </form>
  );
}
