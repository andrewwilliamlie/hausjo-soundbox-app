'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelOrder } from '../actions';

export default function CancelOrder({ id }: { id: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  if (!ask) return <button type="button" className="btn btn-ghost btn-block" onClick={() => setAsk(true)}>Batalkan pesanan</button>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13.5 }}>Batalkan pesanan ini?</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setAsk(false)} disabled={pending}>Tidak</button>
        <button type="button" className="btn btn-primary" style={{ flex: 1, background: 'var(--err)' }} disabled={pending}
          onClick={() => start(async () => { const r = await cancelOrder(id); if (!r.ok) setError(r.error); else router.refresh(); })}>
          {pending ? 'Membatalkan…' : 'Ya, batalkan'}
        </button>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
