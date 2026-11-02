'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { login, type LoginState } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="content screen-in">
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Masuk</h1>
      <label className="field">Nomor WhatsApp atau email
        <input className="input" name="id" autoComplete="username" required />
      </label>
      <label className="field">Kata sandi
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>{pending ? 'Masuk…' : 'Masuk'}</button>
      <p className="hint">Lupa kata sandi? Hubungi CS HausJo, admin akan membantu atur ulang.</p>
      <p className="hint">Belum punya akun? <Link href="/daftar" style={{ fontWeight: 700 }}>Daftar</Link></p>
    </form>
  );
}
