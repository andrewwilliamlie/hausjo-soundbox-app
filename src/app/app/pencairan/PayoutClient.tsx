'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { waLink } from '@/lib/contact';
import type { AppView } from '@/lib/merchant-view';
import { BankSheet, useToast } from '../Sheets';

export default function PayoutClient({ app }: { app: AppView }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useToast();
  const locked = app.status === 'ACTIVE' || app.status === 'BANK';
  const h1 = app.settlement === 'H1';
  return (
    <main className="app-sheet inner">
      <section className="money-card light rise">
        <span className="mc-label">Rekening pencairan</span>
        {app.bankSet ? (
          <>
            <strong style={{ fontSize: 22 }}>{app.bankLabel}</strong>
            <span className="mc-sub">a.n. {app.accountHolder}</span>
          </>
        ) : (
          <strong style={{ fontSize: 20 }}>Belum ditambahkan</strong>
        )}
        <span className="mc-sub"><Icon name="clock" size={16} />Cair {h1 ? 'H+1 (hari kerja berikutnya)' : 'hari yang sama'}</span>
        {locked
          ? <a className="mc-foot" href={waLink(`Halo AIPOS, saya mau mengubah rekening pencairan untuk ${app.businessName} (${app.ticket}).`)} target="_blank" rel="noreferrer">Ubah rekening lewat CS <Icon name="arrowRight" size={18} /></a>
          : <button type="button" className="mc-foot" onClick={() => setOpen(true)}>{app.bankSet ? 'Ubah rekening' : 'Tambah rekening sekarang'} <Icon name="arrowRight" size={18} /></button>}
      </section>

      <section className="card rise rise-1" style={{ gap: 4 }}>
        <strong style={{ fontSize: 15, marginBottom: 4 }}>Biaya</strong>
        {h1 ? (
          <>
            <div className="fee"><span>Transaksi &lt; Rp500.000</span><strong style={{ color: 'var(--ok)' }}>MDR 0%</strong></div>
            <div className="fee"><span>Transaksi ≥ Rp500.000</span><strong>MDR 0,3%</strong></div>
            <div className="fee"><span>Biaya pencairan</span><strong>Rp2.000 / pencairan</strong></div>
          </>
        ) : (
          <>
            <div className="fee"><span>Setiap transaksi</span><strong>MDR 0,7%</strong></div>
            <div className="fee"><span>Biaya pencairan</span><strong style={{ color: 'var(--ok)' }}>Gratis</strong></div>
          </>
        )}
        <div className="fee"><span>Biaya bulanan / sewa</span><strong style={{ color: 'var(--ok)' }}>Tidak ada</strong></div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="h2">Riwayat pencairan</h2>
        <div className="empty-card">
          <Icon name="creditCard" size={28} color="var(--blue)" />
          <strong>Segera hadir</strong>
          <span className="hint">Dana tetap dicairkan otomatis ke rekening Anda. Riwayatnya akan tampil di sini setelah tersambung dengan bank.</span>
        </div>
      </section>
      {toast}
      {open && <BankSheet app={app} onClose={() => setOpen(false)} onSaved={setToast} />}
    </main>
  );
}
