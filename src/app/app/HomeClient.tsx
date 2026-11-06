'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import type { AppView } from '@/lib/merchant-view';
import { Upload } from '../daftar/langkah/Upload';
import { BankSheet, SoundboxSheet, useToast, type SbWay } from './Sheets';

const SB_SUB: Record<AppView['soundboxStatus'], string> = {
  NONE: 'Rp349.000 sekali bayar, opsional',
  BUY: 'Dipesan · cek status di menu Soundbox',
  MARKETPLACE: 'Pesanan marketplace dicocokkan admin',
  SALES: 'Pesanan lewat sales dicocokkan admin',
  ARRIVED: 'Diterima · CS akan memandu aktivasi'
};
const SOON = 'Segera hadir. Fitur ini sedang kami siapkan.';

type Feature = { icon: IconName; label: string; href?: string; external?: boolean; action?: () => void; soon?: boolean };

export default function HomeClient({ app, isNew, outletCount }: { app: AppView; isNew: boolean; outletCount: number }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<'' | 'bank' | 'sb'>('');
  const [sbWay, setSbWay] = useState<SbWay>('buy');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useToast(isNew ? 'Pendaftaran terkirim! Nomor tiket ' + app.ticket : '');

  const active = app.status === 'ACTIVE';
  const sbDone = app.soundboxStatus !== 'NONE';
  const tasks = [
    { name: 'Data pendaftaran terkirim', sub: 'Foto e-KTP, selfie dan data usaha', done: true, tag: 'Selesai', icon: 'ktp' as IconName, open: null as null | (() => void) },
    { name: 'Tambah rekening pencairan', sub: app.bankSet ? `${app.bankLabel} · cair ${app.settlement === 'H1' ? 'H+1' : 'hari yang sama'}` : 'Supaya QRIS bisa diterbitkan bank', done: app.bankSet, tag: app.bankSet ? 'Selesai' : 'Wajib', icon: 'bank' as IconName, open: active || app.status === 'BANK' ? null : () => setSheet('bank') },
    { name: 'Soundbox', sub: !sbDone && app.product === 'SOUNDBOX' ? 'Pilih: beli sekarang, sudah beli di marketplace/sales, atau sudah sampai' : SB_SUB[app.soundboxStatus], done: sbDone, tag: sbDone ? 'Selesai' : app.product === 'SOUNDBOX' ? 'Pilih' : 'Opsional', icon: 'speaker' as IconName, open: () => { setSbWay('buy'); setSheet('sb'); } },
    { name: 'QRIS siap dipakai', sub: active ? 'Aktif · lihat di menu QRIS' : app.bankSet ? 'Diterbitkan bank 1–2 hari kerja' : 'Terbuka setelah rekening ditambahkan', done: active, tag: '', icon: 'qris' as IconName, open: null }
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const needsAction = (!app.bankSet && !active && app.status !== 'REJECTED') || app.status === 'REVISION';

  let statusTitle = 'Pendaftaran sedang diproses';
  let statusSub = 'Admin memeriksa data Anda, biasanya 1–2 hari kerja.';
  if (!app.bankSet && !active) { statusTitle = 'Tambahkan rekening'; statusSub = 'Data Anda sedang diperiksa. QRIS diterbitkan setelah rekening ada.'; }
  if (app.status === 'REVISION') { statusTitle = 'Perlu revisi foto'; statusSub = 'Ganti foto yang ditandai di bawah. Foto lain sudah disetujui.'; }
  if (app.status === 'BANK') { statusTitle = 'Diproses bank'; statusSub = 'Data sudah dikirim ke bank. QRIS terbit dalam 1–2 hari kerja.'; }
  if (app.status === 'REJECTED') { statusTitle = 'Pendaftaran ditolak'; statusSub = 'Hubungi CS AIPOS untuk informasi lebih lanjut.'; }

  const soon = () => setToast(SOON);
  const quick: Feature[] = [
    { icon: 'qris', label: 'QRIS', href: '/app/qris' },
    { icon: 'list', label: 'Mutasi', href: '/app/transaksi' },
    { icon: 'creditCard', label: 'Pencairan', href: '/app/pencairan' },
    { icon: 'file', label: 'Invoice', href: '/app/invoice' }
  ];
  const features: Feature[] = [
    { icon: 'speaker', label: 'Soundbox', action: () => { setSbWay(active && app.product === 'SOUNDBOX' ? 'arrived' : 'buy'); setSheet('sb'); } },
    { icon: 'store', label: 'Toko saya', href: '/app/toko' },
    { icon: 'printer', label: 'Pesan stiker', href: '/app/stiker' },
    { icon: 'edc', label: 'Beli EDC', href: '/app/edc' },
    { icon: 'gift', label: 'Referral', action: soon, soon: true },
    { icon: 'sort', label: 'Laporan', action: soon, soon: true },
    { icon: 'help', label: 'Bantuan', href: '/app/bantuan' },
    { icon: 'grid', label: 'Lainnya', href: '/app/akun' }
  ];
  const q = query.trim().toLowerCase();
  const shown = q ? [...quick, ...features].filter((f) => f.label.toLowerCase().includes(q)) : features;

  const tile = (f: Feature, cls: string) => {
    const inner = (
      <>
        <span className="tile-icon"><Icon name={f.icon} size={24} />{f.soon && <span className="soon-dot" aria-hidden="true" />}</span>
        <span>{f.label}</span>
      </>
    );
    if (f.href) return f.external
      ? <a key={f.label} className={cls} href={f.href} target="_blank" rel="noreferrer">{inner}</a>
      : <Link key={f.label} className={cls} href={f.href}>{inner}</Link>;
    return <button key={f.label} type="button" className={cls} onClick={f.action} aria-label={f.soon ? `${f.label} (segera hadir)` : f.label}>{inner}</button>;
  };

  return (
    <>
      <div className="app-top">
        <header className="app-head">
          <Logo white height={22} />
          <Link href="/app/toko" className="app-hello" style={{ color: '#fff', textDecoration: 'none' }} aria-label="Pilih toko">
            <span>Selamat datang,</span>
            <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{app.businessName}{app.area ? ` · ${app.area}` : ''}<Icon name="chevronDown" size={16} /></strong>
          </Link>
          <button type="button" className="bell" aria-label={needsAction ? 'Ada yang perlu dilengkapi' : 'Notifikasi'}
            onClick={() => document.getElementById('aktivasi')?.scrollIntoView({ behavior: 'smooth' })}>
            <Icon name="bell" size={22} />{needsAction && <span className="bell-dot" />}
          </button>
        </header>

        {active ? (
          <section className="money-card rise">
            <span className="mc-label">Uang masuk hari ini</span>
            <strong className="mc-soon">Segera hadir</strong>
            <span className="mc-sub"><i className="live-dot" />QRIS aktif · NMID {app.nmid}</span>
            <span className="mc-sub" style={{ opacity: 0.85 }}>Riwayat transaksi sedang kami sambungkan dengan bank.</span>
            <Link href="/app/pencairan" className="mc-foot">Cair {app.settlement === 'H1' ? 'H+1' : 'hari yang sama'} ke {app.bankName || 'rekening Anda'} <Icon name="arrowRight" size={18} /></Link>
          </section>
        ) : (
          <section className="money-card rise">
            <span className="mc-label">Aktivasi toko · {doneCount}/4 selesai</span>
            <strong style={{ fontSize: 22 }}>{statusTitle}</strong>
            <span className="mc-sub">{statusSub}</span>
            <div className="bar mc-bar" aria-hidden="true"><span style={{ width: `${(doneCount / 4) * 100}%` }} /></div>
            {!app.bankSet && app.status !== 'REJECTED'
              ? <button type="button" className="mc-foot" onClick={() => setSheet('bank')}>Tambah rekening sekarang <Icon name="arrowRight" size={18} /></button>
              : <span className="mc-foot" style={{ cursor: 'default' }}>Tiket {app.ticket}</span>}
          </section>
        )}
      </div>

      <nav className="quick-band" aria-label="Menu utama">
        {quick.map((f) => tile(f, 'q-tile'))}
      </nav>

      <main className="app-sheet">
        <div style={{ display: 'flex', gap: 10 }}>
          <label className="search-pill">
            <Icon name="search" size={18} color="var(--muted)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari fitur" aria-label="Cari fitur" />
          </label>
          <Link href="/app/toko" className="pill-btn" style={{ textDecoration: 'none' }}><Icon name="store" size={18} />{outletCount > 1 ? `Ganti toko (${outletCount})` : 'Tambah toko'}</Link>
        </div>

        <div className="feat-grid">
          {shown.map((f) => tile(f, 'feat'))}
          {shown.length === 0 && <p className="hint" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Fitur tidak ditemukan.</p>}
        </div>

        {app.status === 'REVISION' && app.rejected.length > 0 && (
          <section className="card rise" style={{ background: '#fffaeb', borderColor: '#fec84b', gap: 12 }}>
            <strong style={{ color: '#7a2e0e' }}>{app.rejected.length} foto perlu diganti</strong>
            {app.rejected.map((r) => (
              <div key={r.kind} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#7a2e0e' }}><strong>{r.label}:</strong> {r.reason}</span>
                <Upload kind={r.kind} label={'Ambil ulang ' + r.label.toLowerCase()} done={false} onDone={() => { setToast('Foto terkirim. Kami periksa lagi.'); router.refresh(); }} />
              </div>
            ))}
          </section>
        )}

        {!active && (
          <section id="aktivasi" style={{ display: 'flex', flexDirection: 'column', gap: 4, scrollMarginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="h2">Langkah aktivasi</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{doneCount}/4</span>
            </div>
            {tasks.map((t) => (
              <button key={t.name} type="button" className="tap task-row" disabled={!t.open} onClick={() => t.open?.()}>
                <span aria-hidden="true" className={`task-dot ${t.done ? 'done' : t.open ? 'todo' : 'lock'}`} style={{ width: 36, height: 36 }}>
                  <Icon name={t.done ? 'check' : t.open ? t.icon : 'lock'} size={18} strokeWidth={t.done ? 3 : 2} />
                </span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{t.name}</strong><span className="hint">{t.sub}</span></span>
                {t.tag && <span className={`tag ${t.done ? 'ok' : t.tag === 'Wajib' ? 'must' : ''}`}>{t.tag}</span>}
                {t.open && <Icon name="chevron" size={18} color="var(--muted)" />}
              </button>
            ))}
          </section>
        )}

        {active && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="h2">Transaksi terbaru</h2>
              <Link href="/app/transaksi" style={{ fontSize: 14, fontWeight: 700 }}>Lihat semua</Link>
            </div>
            <div className="empty-card">
              <Icon name="list" size={26} color="var(--blue)" />
              <strong>Belum ada data transaksi di aplikasi</strong>
              <span className="hint">Pembayaran QRIS tetap masuk dan dicairkan ke rekening Anda. Riwayatnya akan tampil di sini setelah tersambung dengan bank.</span>
            </div>
          </section>
        )}

        {active && app.product === 'SOUNDBOX' && app.soundboxStatus !== 'ARRIVED' && (
          <button type="button" onClick={() => { setSbWay('arrived'); setSheet('sb'); }} className="card tap" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <span className="tile-icon" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}><Icon name="scan" size={22} /></span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><strong>Soundbox sudah sampai?</strong>
              <span className="hint">Pindai SN Soundbox, CS akan memandu aktivasi dan cara pakai.</span></span>
            <Icon name="chevron" size={18} color="var(--muted)" />
          </button>
        )}
        {app.needsGuide && <div className="note fade-in" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="whatsapp" size={20} />SN {app.serialNumber} tercatat. CS AIPOS akan menghubungi Anda lewat WhatsApp.</div>}
      </main>

      {toast}
      {sheet === 'bank' && <BankSheet app={app} onClose={() => setSheet('')} onSaved={setToast} />}
      {sheet === 'sb' && <SoundboxSheet initialWay={sbWay} onClose={() => setSheet('')} onSaved={setToast} />}
    </>
  );
}
