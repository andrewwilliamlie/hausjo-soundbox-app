'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { CS_EMAIL, CS_WHATSAPP_DISPLAY, waLink } from '@/lib/contact';
import { login, type LoginState } from './actions';

type PanelKind = '' | 'login' | 'fees' | 'how' | 'official';

function Panel({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-up sheet-panel">
        <span aria-hidden="true" className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}

/** Welcome screen: promos, quick info and a "Masuk" button that opens the login form in a bottom sheet. */
export default function WelcomeLogin({ storeName, openForm }: { storeName: string; openForm: boolean }) {
  const [panel, setPanel] = useState<PanelKind>(openForm ? 'login' : '');
  const [note, setNote] = useState('');
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  const showLogin = panel === 'login';

  const menu: Array<[IconName, string, () => void]> = [
    ['truck', 'Lacak pesanan', () => { setNote('Masuk untuk melihat status pesanan Soundbox dan nomor resi.'); setPanel('login'); }],
    ['dollar', 'Biaya admin', () => setPanel('fees')],
    ['speaker', 'Cara kerja', () => setPanel('how')]
  ];

  return (
    <div className="shell welcome">
      <header className="welcome-top">
        <Logo white height={46} tagline />
        <span className="welcome-hi">Selamat datang{storeName ? ',' : ' di AIPOS'}</span>
        {storeName && <strong className="welcome-name">{storeName}</strong>}
      </header>

      <main className="welcome-sheet">
        <h2 className="h2" style={{ fontSize: 17 }}>Ada yang baru di <em className="brand-em">AIPOS</em></h2>
        <div className="promo-row" role="list">
          <Link role="listitem" href="/daftar?produk=soundbox" className="promo light">
            <strong>Soundbox Rp349rb<br />sekali bayar, tanpa sewa</strong>
            <span className="promo-btn">Pesan sekarang</span>
          </Link>
          <button role="listitem" type="button" className="promo dark" onClick={() => setPanel('fees')}>
            <strong>MDR 0% di bawah Rp500rb</strong>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Pencairan H+1</span>
          </button>
          <Link role="listitem" href="/daftar?produk=qris" className="promo light">
            <strong>QRIS gratis<br />aktif 1–2 hari kerja</strong>
            <span className="promo-btn">Daftar QRIS</span>
          </Link>
        </div>

        <h3 className="welcome-sub">Menu cepat</h3>
        <div className="welcome-menu">
          {menu.map(([icon, label, fn]) => (
            <button key={label} type="button" className="feat" onClick={fn}>
              <span className="tile-icon"><Icon name={icon} size={24} /></span><span>{label}</span>
            </button>
          ))}
        </div>

        <div className="chip-row">
          <a className="info-chip" href={waLink('Halo AIPOS, saya mau bertanya.')} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} color="var(--ok)" />WhatsApp {CS_WHATSAPP_DISPLAY}</a>
          <button type="button" className="info-chip" onClick={() => setPanel('official')}><Icon name="shield" size={18} color="var(--blue)" />Cek nomor resmi</button>
        </div>

        <div className="welcome-actions">
          <button type="button" className="btn btn-primary btn-block pill" onClick={() => { setNote(''); setPanel('login'); }}>Masuk</button>
          <p className="hint" style={{ textAlign: 'center', fontSize: 13 }}>Belum punya akun? <Link href="/daftar" style={{ fontWeight: 700 }}>Daftar gratis</Link></p>
        </div>
      </main>

      {showLogin && (
        <Panel label="Masuk" onClose={() => setPanel('')}>
          <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Masuk</h2>
            {note && <p className="note" style={{ margin: 0 }}>{note}</p>}
            <label className="field">Nomor WhatsApp atau email
              <input className="input" name="id" autoComplete="username" required autoFocus />
            </label>
            <label className="field">Kata sandi
              <input className="input" name="password" type="password" autoComplete="current-password" required />
            </label>
            {state.error && <p className="err" role="alert">{state.error}</p>}
            <button type="submit" className="btn btn-primary btn-block pill" disabled={pending}>{pending ? 'Masuk…' : 'Masuk'}</button>
            <p className="hint" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Link href="/masuk/lupa" style={{ fontWeight: 700 }}>Lupa kata sandi?</Link>
              <Link href="/daftar" style={{ fontWeight: 700 }}>Daftar gratis</Link>
            </p>
          </form>
        </Panel>
      )}

      {panel === 'fees' && (
        <Panel label="Biaya" onClose={() => setPanel('')}>
          <h2 className="h2" style={{ fontSize: 19 }}>Biaya jelas dari awal</h2>
          <div>
            <div className="fee"><span>Cair H+1, transaksi &lt; Rp500.000</span><strong style={{ color: 'var(--ok)' }}>MDR 0%</strong></div>
            <div className="fee"><span>Cair H+1, transaksi ≥ Rp500.000</span><strong>MDR 0,3%</strong></div>
            <div className="fee"><span>Biaya pencairan H+1</span><strong>Rp2.000</strong></div>
            <div className="fee"><span>Cair hari yang sama</span><strong>MDR 0,7%</strong></div>
            <div className="fee"><span>Biaya bulanan / sewa</span><strong style={{ color: 'var(--ok)' }}>Tidak ada</strong></div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setPanel('')}>Tutup</button>
        </Panel>
      )}

      {panel === 'how' && (
        <Panel label="Cara kerja" onClose={() => setPanel('')}>
          <h2 className="h2" style={{ fontSize: 19 }}>Cara kerja Soundbox QRIS</h2>
          {([
            ['qris', 'Pembeli scan QRIS', 'Pakai GoPay, OVO, DANA, ShopeePay atau m-banking apa pun.'],
            ['speaker', 'Soundbox menyebut nominal', '“Pembayaran diterima, Rp25.000”. Tidak perlu cek HP.'],
            ['bank', 'Uang cair ke rekening', 'H+1 atau di hari yang sama, sesuai pilihan Anda.']
          ] as const).map(([ic, t, s]) => (
            <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="tile-icon"><Icon name={ic} size={22} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{s}</span></span>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setPanel('')}>Tutup</button>
        </Panel>
      )}

      {panel === 'official' && (
        <Panel label="Kontak resmi" onClose={() => setPanel('')}>
          <h2 className="h2" style={{ fontSize: 19 }}>Kontak resmi AIPOS</h2>
          <p className="hint">Hati-hati penipuan. AIPOS tidak pernah meminta kata sandi, PIN atau kode OTP Anda.</p>
          <div>
            <div className="fee"><span>WhatsApp CS</span><strong>{CS_WHATSAPP_DISPLAY}</strong></div>
            <div className="fee"><span>Email</span><strong>{CS_EMAIL}</strong></div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setPanel('')}>Tutup</button>
        </Panel>
      )}
    </div>
  );
}
