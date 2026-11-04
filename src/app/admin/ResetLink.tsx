'use client';

import { useActionState, useState } from 'react';
import { sendMerchantReset, type ResetLinkState } from './actions';

/** Admin button: email the merchant a password link and offer the same link for WhatsApp. */
export default function ResetLink({ id, phone }: { id: string; phone: string }) {
  const [state, action, pending] = useActionState<ResetLinkState, FormData>(sendMerchantReset, { error: null });
  const [copied, setCopied] = useState(false);
  const wa = state.link
    ? `https://wa.me/62${phone.replace(/^0/, '')}?text=${encodeURIComponent(`Halo, ini link AIPOS untuk membuat kata sandi baru (berlaku ${state.hours} jam, sekali pakai):\n${state.link}`)}`
    : '';
  return (
    <form action={action} className="card" style={{ gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      <p className="hint" style={{ fontWeight: 700, letterSpacing: .6 }}>AKUN MERCHANT</p>
      {!state.link && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-ghost" disabled={pending}>{pending ? 'Membuat link…' : 'Kirim link atur ulang kata sandi'}</button>
          <span className="hint">Untuk merchant yang lupa kata sandi. Link dikirim ke emailnya.</span>
        </div>
      )}
      {state.error && <p className="err" role="alert">{state.error}</p>}
      {state.link && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="okmsg">Link terkirim ke email merchant (berlaku {state.hours} jam, sekali pakai). Kirim juga lewat WhatsApp bila perlu:</span>
          <code style={{ fontSize: 12, wordBreak: 'break-all', background: 'var(--ground)', padding: 8, borderRadius: 8 }}>{state.link}</code>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn" style={{ background: 'var(--ok)', color: '#fff' }} href={wa} target="_blank" rel="noreferrer">Kirim via WhatsApp</a>
            <button type="button" className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(state.link!); setCopied(true); }}>{copied ? 'Tersalin' : 'Salin link'}</button>
          </div>
        </div>
      )}
    </form>
  );
}
