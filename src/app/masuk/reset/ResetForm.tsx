'use client';

import { useActionState, useState } from 'react';
import { IconTile } from '@/components/Icon';
import PinInput from '@/components/PinInput';
import { checkPin } from '@/lib/rules';
import { resetPassword, type ResetState } from '../reset-actions';

export default function ResetForm({ token, who }: { token: string; who: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, { error: null });
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const c = checkPin(pin);
  return (
    <form action={action} className="content screen-in">
      <IconTile name="shield" size={52} />
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Buat PIN baru</h1>
      <p className="hint" style={{ fontSize: 13.5 }}>Untuk akun {who}. Setelah disimpan, Anda langsung masuk dan perangkat lain dikeluarkan.</p>
      <input type="hidden" name="t" value={token} />
      <PinInput label="PIN baru (6 angka)" name="next" value={pin} onChange={setPin} autoComplete="new-password" autoFocus bad={pin.length === 6 && !c.ok}
        hint={pin.length === 6 ? <span className={c.ok ? 'okmsg' : 'err'}>{c.message}</span> : undefined} />
      <PinInput label="Ulangi PIN baru" name="again" value={pin2} onChange={setPin2} autoComplete="new-password" bad={pin2.length === 6 && pin2 !== pin}
        hint={pin2.length === 6 ? <span className={pin2 === pin ? 'okmsg' : 'err'}>{pin2 === pin ? 'PIN cocok' : 'PIN tidak sama'}</span> : undefined} />
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending || !c.ok || pin2 !== pin}>{pending ? 'Menyimpan…' : 'Simpan & masuk'}</button>
    </form>
  );
}
