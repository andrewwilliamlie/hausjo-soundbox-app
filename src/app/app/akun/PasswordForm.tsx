'use client';

import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { changeMerchantPassword } from '../actions';

export default function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <button type="button" className="card tap rise rise-2" onClick={() => { setOpen(true); setMsg(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--ink)', textAlign: 'left' }}>
        <Icon name="lock" size={20} /><strong style={{ flex: 1, fontSize: 14 }}>Ganti kata sandi</strong><Icon name="chevron" size={18} />
        {msg?.ok && <span className="okmsg">{msg.text}</span>}
      </button>
    );
  }
  return (
    <section className="card fade-in" style={{ gap: 12 }}>
      <strong style={{ fontSize: 15 }}>Ganti kata sandi</strong>
      <label className="field">Kata sandi saat ini<input className="input" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
      <label className="field">Kata sandi baru<input className="input" type="password" autoComplete="new-password" minLength={8} placeholder="Minimal 8 karakter" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
      <label className="field">Ulangi kata sandi baru<input className="input" type="password" autoComplete="new-password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} /></label>
      {msg && <p className={msg.ok ? 'okmsg' : 'err'} role="alert">{msg.text}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Batal</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={pending}
          onClick={() => start(async () => {
            const r = await changeMerchantPassword(f);
            setMsg({ ok: r.ok, text: r.ok ? r.message! : r.error! });
            if (r.ok) { setF({ current: '', next: '', again: '' }); setOpen(false); }
          })}>{pending ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </section>
  );
}
