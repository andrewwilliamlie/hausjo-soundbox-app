'use client';

import { useActionState } from 'react';
import { IconTile } from '@/components/Icon';
import { resetPassword, type ResetState } from '../reset-actions';

export default function ResetForm({ token, who }: { token: string; who: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, { error: null });
  return (
    <form action={action} className="content screen-in">
      <IconTile name="shield" size={52} />
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Buat kata sandi baru</h1>
      <p className="hint" style={{ fontSize: 13.5 }}>Untuk akun {who}. Setelah disimpan, Anda langsung masuk dan perangkat lain dikeluarkan.</p>
      <input type="hidden" name="t" value={token} />
      <label className="field">Kata sandi baru<input className="input" name="next" type="password" autoComplete="new-password" minLength={8} placeholder="Minimal 8 karakter" required /></label>
      <label className="field">Ulangi kata sandi baru<input className="input" name="again" type="password" autoComplete="new-password" minLength={8} required /></label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan & masuk'}</button>
    </form>
  );
}
