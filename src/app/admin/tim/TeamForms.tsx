'use client';

import { useActionState } from 'react';
import { addMember, resetMember, updateMember, type TeamState } from './actions';

const ROLE_OPTIONS: Array<[string, string]> = [['REVIEWER', 'Pemeriksa'], ['ACTIVATION', 'Aktivasi & pengiriman'], ['ADMIN', 'Admin (semua akses)']];
const init: TeamState = { error: null };

/** Shows a temporary password once, so it can be passed on in person or by WhatsApp. */
function TempBox({ state }: { state: TeamState }) {
  if (!state.temp) return null;
  return (
    <div className="fade-in" style={{ background: 'var(--ok-soft)', border: '1px solid #a6f4c5', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
      <span>{state.done === 'added' ? 'Akun dibuat' : 'Kata sandi diatur ulang'} untuk <strong>{state.who}</strong>. Kata sandi sementara (juga dikirim ke emailnya):</span>
      <code style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1, color: 'var(--navy)', userSelect: 'all' }}>{state.temp}</code>
      <span className="hint">Hanya tampil sekali. Ia wajib membuat kata sandi baru saat masuk.</span>
    </div>
  );
}

export function AddMember() {
  const [state, action, pending] = useActionState(addMember, init);
  return (
    <form action={action} className="card" style={{ gap: 12 }}>
      <strong style={{ fontSize: 15 }}>Tambah anggota</strong>
      <label className="field">Nama<input className="input" name="name" required /></label>
      <label className="field">Email kerja<input className="input" name="email" type="email" required /></label>
      <label className="field">Peran
        <select className="input" name="role" defaultValue="REVIEWER">{ROLE_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
      </label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <TempBox state={state} />
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Membuat…' : 'Buat akun'}</button>
    </form>
  );
}

type Member = { id: string; name: string; email: string; role: string; active: boolean; pending: boolean; lastLogin: string };

export function MemberRow({ m, self }: { m: Member; self: boolean }) {
  const [saved, save, saving] = useActionState(updateMember, init);
  const [reset, doReset, resetting] = useActionState(resetMember, init);
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10, opacity: m.active ? 1 : 0.6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ fontSize: 14 }}>{m.name}{self ? ' (Anda)' : ''}</strong>
          <span className="hint">{m.email} · masuk terakhir: {m.lastLogin}</span>
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          {!m.active && <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#eef1f6', color: 'var(--muted)' }}>Nonaktif</span>}
          {m.active && m.pending && <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>Belum ganti kata sandi</span>}
        </span>
      </div>
      {!self && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <form action={save} style={{ display: 'flex', gap: 8 }}>
            <input type="hidden" name="id" value={m.id} />
            <select className="input" name="role" defaultValue={m.role} aria-label={'Peran ' + m.name} style={{ minHeight: 38, fontSize: 13, padding: '6px 10px', width: 'auto' }}>
              {ROLE_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <button className="btn btn-ghost" style={{ minHeight: 38, fontSize: 13 }} disabled={saving}>Simpan peran</button>
          </form>
          <form action={save}>
            <input type="hidden" name="id" value={m.id} /><input type="hidden" name="active" value={m.active ? '0' : '1'} />
            <button className="btn btn-ghost" style={{ minHeight: 38, fontSize: 13, color: m.active ? 'var(--err)' : 'var(--ok)' }} disabled={saving}>{m.active ? 'Nonaktifkan' : 'Aktifkan lagi'}</button>
          </form>
          {m.active && (
            <form action={doReset}>
              <input type="hidden" name="id" value={m.id} />
              <button className="btn btn-ghost" style={{ minHeight: 38, fontSize: 13 }} disabled={resetting}>{resetting ? 'Mengatur…' : 'Atur ulang kata sandi'}</button>
            </form>
          )}
        </div>
      )}
      {(saved.error || reset.error) && <p className="err" role="alert">{saved.error || reset.error}</p>}
      {saved.done === 'saved' && !saved.error && <span className="okmsg fade-in">Tersimpan</span>}
      <TempBox state={reset} />
    </div>
  );
}
