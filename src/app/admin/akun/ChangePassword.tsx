'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { changeOwnPassword, type PwState } from './actions';

export default function ChangePassword({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<PwState, FormData>(changeOwnPassword, { error: null });
  if (state.ok) {
    return (
      <section className="card fade-in" style={{ gap: 12 }}>
        <strong className="okmsg" style={{ fontSize: 15 }}>Kata sandi baru tersimpan.</strong>
        <span className="hint">Perangkat lain yang masih masuk dengan akun ini sudah dikeluarkan.</span>
        <Link className="btn btn-primary" href="/admin">{forced ? 'Buka antrean' : 'Kembali ke antrean'}</Link>
      </section>
    );
  }
  return (
    <form action={action} className="card" style={{ gap: 12 }}>
      <strong style={{ fontSize: 15 }}>Ganti kata sandi</strong>
      <label className="field">{forced ? 'Kata sandi sementara' : 'Kata sandi saat ini'}<input className="input" name="current" type="password" autoComplete="current-password" required /></label>
      <label className="field">Kata sandi baru (min. 10 karakter)<input className="input" name="next" type="password" autoComplete="new-password" minLength={10} required /></label>
      <label className="field">Ulangi kata sandi baru<input className="input" name="again" type="password" autoComplete="new-password" minLength={10} required /></label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan kata sandi'}</button>
    </form>
  );
}
