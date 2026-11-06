'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CS_EMAIL } from '@/lib/contact';

const SEEN = 'aipos_intro_seen';
const seen = () => { try { return localStorage.getItem(SEEN) === '1'; } catch { return false; } };
const markSeen = () => { try { localStorage.setItem(SEEN, '1'); } catch { /* private mode */ } };

type Slide = { title: string; body: string; art: React.ReactNode };

const Badge = ({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) => (
  <div className="intro-badge" style={style}>{children}</div>
);
const Check = () => <span className="intro-dot" style={{ background: '#22B05B' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg></span>;

const SLIDES: Slide[] = [
  {
    title: 'Konfirmasi otomatis, QRIS makin praktis',
    body: 'Soundbox AIPOS langsung bersuara setiap pembayaran QRIS masuk. Kasir tetap melayani, tak perlu cek HP.',
    art: (
      <>
        <img src="/onboarding/scan-qris.jpg" alt="Pelanggan scan QRIS di Soundbox AIPOS" className="intro-photo" style={{ width: '64%', aspectRatio: '250 / 340', objectPosition: '50% 30%' }} />
        <Badge style={{ right: '6%', bottom: '10%' }}><Check /><span style={{ display: 'flex', flexDirection: 'column' }}><span className="intro-small">Transaksi berhasil</span><b>Rp85.000</b></span></Badge>
        <div className="intro-badge intro-round" style={{ left: '6%', bottom: '24%' }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1F5FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg></div>
      </>
    )
  },
  {
    title: 'Perlindungan cerdas untuk setiap transaksi',
    body: 'Suara dan layar nominal memastikan uang benar-benar masuk. Screenshot bukti transfer palsu tak bisa mengelabui lagi.',
    art: (
      <>
        <div className="intro-photo" style={{ width: '62%', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', borderWidth: 6 }}>
          <img src="/onboarding/soundbox-nominal.jpg" alt="Layar Soundbox AIPOS menampilkan nominal Rp85.000" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', display: 'block' }} />
        </div>
        <Badge style={{ left: '6%', bottom: '16%' }}><span className="intro-dot sq" style={{ background: '#FFF1D6' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B26A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg></span><b className="intro-13">Nominal tampil di layar</b></Badge>
        <Badge style={{ right: '6%', bottom: '5%' }}><span className="intro-dot sq" style={{ background: '#FDE3E3' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0262D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM9.5 12.5l5 5M14.5 12.5l-5 5" /></svg></span><b className="intro-13">Bukti palsu ditolak</b></Badge>
      </>
    )
  },
  {
    title: 'Terima kartu debit & kredit di mana saja',
    body: 'EDC Android A920 Pro siap terima kartu debit, kredit, dan QRIS dalam satu mesin. Cukup tap, insert, atau gesek.',
    art: (
      <>
        <img src="/onboarding/edc-a920.jpg" alt="EDC Android PAX A920 Pro dengan kartu terpasang" className="intro-photo" style={{ width: '62%', aspectRatio: '244 / 320', objectPosition: '50% 40%' }} />
        <Badge style={{ right: '5%', top: '14%' }}><span style={{ display: 'flex', flexDirection: 'column' }}><span className="intro-small">EDC Android</span><b>A920 Pro</b></span></Badge>
        <Badge style={{ left: '5%', bottom: '8%' }}><span className="intro-dot sq" style={{ background: '#E5EEFF' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F5FE0" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg></span><b className="intro-13">Debit · Kredit · QRIS</b></Badge>
      </>
    )
  },
  {
    title: 'Semua transaksi, satu aplikasi',
    body: 'Kelola QRIS, EDC, Soundbox, dan semua tokomu dari satu aplikasi. Riwayat transaksi dan laporan segera hadir.',
    art: (
      <>
        <img src="/onboarding/soundbox-stand.jpg" alt="Soundbox AIPOS" className="intro-photo" style={{ position: 'absolute', right: '6%', top: '6%', width: '40%', aspectRatio: '150 / 250', objectPosition: '50% 30%' }} />
        <div className="intro-badge intro-sales" style={{ left: '4%', top: '16%' }}>
          <span className="intro-small">Penjualan hari ini</span>
          <b style={{ fontSize: 20, marginTop: -6 }}>Rp3.910.000</b>
          <span className="intro-bars" aria-hidden="true">{[22, 34, 28, 44, 38, 54, 30].map((h, i) => <i key={i} style={{ height: h, background: i === 5 ? '#1F5FE0' : '#CFE0FF' }} />)}</span>
          <span className="intro-row"><span>QRIS</span><b>Rp2.460.000</b></span>
          <span className="intro-row"><span>Kartu</span><b>Rp1.450.000</b></span>
        </div>
        <Badge style={{ left: '10%', bottom: '4%', padding: '9px 14px', gap: 8 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F5FE0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9M3 9h18v11H3z" /></svg><b style={{ fontSize: 12 }}>3 toko terpantau</b></Badge>
      </>
    )
  }
];

export default function Intro() {
  const router = useRouter();
  const [phase, setPhase] = useState<'splash' | 'slides'>('splash');
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const last = SLIDES.length - 1;

  // Splash for a moment; people who have seen the intro go straight to login.
  useEffect(() => {
    const t = setTimeout(() => (seen() ? router.replace('/masuk') : setPhase('slides')), seen() ? 900 : 1600);
    return () => clearTimeout(t);
  }, [router]);

  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = track.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  useEffect(() => { if (idx === last) markSeen(); }, [idx, last]);

  if (phase === 'splash') {
    return (
      <button type="button" className="intro-splash" onClick={() => (seen() ? router.replace('/masuk') : setPhase('slides'))} aria-label="AIPOS, ketuk untuk lanjut">
        <span className="intro-ring" style={{ width: 520, height: 520, top: '8%' }} />
        <span className="intro-ring" style={{ width: 380, height: 380, top: '17%', borderColor: 'rgba(255,255,255,.14)' }} />
        <span style={{ flex: 1 }} />
        <img src="/onboarding/logo-white.png" alt="AIPOS" className="intro-logo" />
        <span className="intro-tag">Terima pembayaran, lebih tenang</span>
        <span style={{ flex: 1 }} />
        <span className="intro-load" aria-hidden="true"><i /><i /><i /></span>
        <span className="intro-legal">PT Global Platform Asiatic</span>
      </button>
    );
  }

  return (
    <div className="intro">
      <div className="intro-track" ref={track} onScroll={onScroll} aria-roledescription="carousel" aria-label="Pengenalan AIPOS">
        {SLIDES.map((s, i) => (
          <section key={s.title} className="intro-slide" aria-roledescription="slide" aria-label={`${i + 1} dari ${SLIDES.length}`} aria-hidden={i !== idx}>
            <div className="intro-top">
              <div className="intro-bar">
                <img src="/onboarding/logo-white.png" alt="AIPOS" style={{ width: 84, height: 'auto' }} />
                {i < last && <button type="button" className="intro-skip" onClick={() => go(last)} tabIndex={i === idx ? 0 : -1}>Lewati</button>}
              </div>
              <span className="intro-ring" style={{ width: 360, height: 360, top: 90, borderColor: 'rgba(255,255,255,.14)' }} />
              <div className="intro-art">{s.art}</div>
            </div>
            <div className="intro-text">
              {i === last && <Dots n={SLIDES.length} cur={i} />}
              <h1>{s.title}</h1>
              <p>{s.body}</p>
            </div>
            {i < last ? (
              <div className="intro-foot">
                <Dots n={SLIDES.length} cur={i} />
                <button type="button" className="intro-next" aria-label="Lanjut" onClick={() => go(i + 1)} tabIndex={i === idx ? 0 : -1}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            ) : (
              <div className="intro-cta">
                <Link href="/paket" className="intro-btn primary" onClick={markSeen} tabIndex={i === idx ? 0 : -1}>Daftar sekarang</Link>
                <Link href="/masuk" className="intro-btn" onClick={markSeen} tabIndex={i === idx ? 0 : -1}>Saya sudah punya akun</Link>
                <span className="intro-help">Butuh bantuan? <a href={`mailto:${CS_EMAIL}`} tabIndex={i === idx ? 0 : -1}>{CS_EMAIL}</a></span>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function Dots({ n, cur }: { n: number; cur: number }) {
  return (
    <span className="intro-dots" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <i key={i} className={i === cur ? 'on' : ''} />)}
    </span>
  );
}
