'use client';

import { useActionState } from 'react';
import { backupNow, type BackupState } from './actions';

export default function BackupNow() {
  const [state, action, pending] = useActionState<BackupState>(backupNow, { error: null });
  return (
    <form action={action} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      <button className="btn btn-primary" disabled={pending}>{pending ? 'Membuat cadangan…' : 'Buat cadangan sekarang'}</button>
      {state.name && <span className="okmsg fade-in">Tersimpan: {state.name}</span>}
      {state.error && <span className="err" role="alert">{state.error}</span>}
    </form>
  );
}
