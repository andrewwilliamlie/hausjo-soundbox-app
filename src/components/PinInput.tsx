'use client';

import { useId, useRef, useState } from 'react';
import Icon from './Icon';

/**
 * 6-digit PIN field shown as six boxes. One real input (numeric keypad, masked) sits over the boxes so paste,
 * autofill and screen readers all work. Controlled when `value`/`onChange` are given, otherwise posts via `name`.
 */
export default function PinInput({ label, name, value, onChange, autoComplete = 'current-password', autoFocus, hint, bad }: {
  label: string; name?: string; value?: string; onChange?: (v: string) => void; autoComplete?: string; autoFocus?: boolean; hint?: React.ReactNode; bad?: boolean;
}) {
  const id = useId();
  const [own, setOwn] = useState('');
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const v = value ?? own;
  const set = (s: string) => { const clean = s.replace(/\D/g, '').slice(0, 6); onChange ? onChange(clean) : setOwn(clean); };
  return (
    <div className="field">
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label htmlFor={id}>{label}</label>
        <button type="button" onClick={() => setShow((x) => !x)} className="pin-eye" aria-label={show ? 'Sembunyikan PIN' : 'Tampilkan PIN'}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </span>
      <div className={`pin-boxes${bad ? ' bad' : ''}`} onClick={() => ref.current?.focus()}>
        <input ref={ref} id={id} name={name} value={v} onChange={(e) => set(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          type={show ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete={autoComplete} autoFocus={autoFocus} required aria-describedby={hint ? id + '-h' : undefined} />
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} aria-hidden="true" className={`pin-box${i < v.length ? ' filled' : ''}${focus && i === Math.min(v.length, 5) ? ' cur' : ''}`}>
            {i < v.length ? (show ? v[i] : <i className="pin-dot" />) : ''}
          </span>
        ))}
      </div>
      {hint && <span id={id + '-h'}>{hint}</span>}
    </div>
  );
}
