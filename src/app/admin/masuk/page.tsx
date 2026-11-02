'use client';

import { useActionState } from 'react';
import { adminLogin } from '../actions';

export default function AdminLogin() {
  const [state, action, pending] = useActionState(adminLogin, { error: null as string | null });
  return (
    <div className="admin">
      <div className="admin-top"><strong>HAUS<span style={{ color: '#8db4ff' }}>JO</span> · Admin</strong></div>
      <form action={action} className="card" style={{ maxWidth: 380, margin: '48px auto', gap: 14 }}>
        <h1 className="h2" style={{ fontSize: 20 }}>Masuk admin</h1>
        <label className="field">Email<input className="input" name="email" type="email" autoComplete="username" required /></label>
        <label className="field">Kata sandi<input className="input" name="password" type="password" autoComplete="current-password" required /></label>
        {state.error && <p className="err" role="alert">{state.error}</p>}
        <button className="btn btn-primary" disabled={pending}>{pending ? 'Masuk…' : 'Masuk'}</button>
      </form>
    </div>
  );
}
