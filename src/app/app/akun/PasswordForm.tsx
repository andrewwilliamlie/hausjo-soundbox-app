'use client';

import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import PinInput from '@/components/PinInput';
import { changeMerchantPassword } from '../actions';

/** "Ganti PIN" in Akun. Accounts made before PINs confirm with their old password. */
export default function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [legacy, setLegacy] = useState(false);
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <button type="button" className="card tap rise rise-2" onClick={() => { setOpen(true); setMsg(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--ink)', textAlign: 'left', flexWrap: 'wrap' }}>
        <Icon name="lock" size={20} /><strong style={{ flex: 1, fontSize: 14 }}>Ganti PIN</strong><Icon name="chevron" size={18} />
        {msg?.ok && <span className="okmsg" style={{ width: '100%' }}>{msg.text}</span>}
      </button>
    );
  }
  return (
    <section className="card fade-in" style={{ gap: 14 }}>
      <strong style={{ fontSize: 15 }}>Ganti PIN</strong>
      {legacy
        ? <label className="field">Kata sandi lama<input className="input" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
        : <PinInput label="PIN saat ini" value={f.current} onChange={(v) => setF({ ...f, current: v })} />}
      <button type="button" className="hint" onClick={() => { setLegacy((x) => !x); setF({ ...f, current: '' }); }} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', textDecoration: 'underline', cursor: 'pointer' }}>
        {legacy ? 'Pakai PIN saat ini' : 'Akun lama dengan kata sandi? Pakai kata sandi'}
      </button>
      <PinInput label="PIN baru (6 angka)" value={f.next} onChange={(v) => setF({ ...f, next: v })} autoComplete="new-password" />
      <PinInput label="Ulangi PIN baru" value={f.again} onChange={(v) => setF({ ...f, again: v })} autoComplete="new-password" bad={f.again.length === 6 && f.again !== f.next} />
      {msg && <p className={msg.ok ? 'okmsg' : 'err'} role="alert">{msg.text}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Batal</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={pending}
          onClick={() => start(async () => {
            const r = await changeMerchantPassword(f);
            setMsg({ ok: r.ok, text: r.ok ? r.message! : r.error! });
            if (r.ok) { setF({ current: '', next: '', again: '' }); setOpen(false); setLegacy(false); }
          })}>{pending ? 'Menyimpan…' : 'Simpan PIN'}</button>
      </div>
    </section>
  );
}
