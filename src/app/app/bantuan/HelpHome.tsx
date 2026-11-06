'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon, { IconTile } from '@/components/Icon';
import { CS_WHATSAPP, CS_WHATSAPP_DISPLAY } from '@/lib/contact';
import { CATEGORIES, TOPICS } from '@/lib/help';

type Recent = { number: string; topic: string; topicId: string; status: string; open: boolean; at: string };

export default function HelpHome({ initialCat, recent }: { initialCat: string; recent: Recent[] }) {
  const [cat, setCat] = useState(CATEGORIES.some((c) => c.id === initialCat) ? initialCat : '');
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const found = term ? TOPICS.filter((t) => `${t.title} ${t.summary}`.toLowerCase().includes(term)) : cat ? TOPICS.filter((t) => t.cat === cat) : [];
  const current = CATEGORIES.find((c) => c.id === cat);

  return (
    <main className="app-sheet inner" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label className="search-pill">
        <Icon name="search" size={18} color="var(--muted)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari masalah, misal: struk, koneksi, pencairan" aria-label="Cari bantuan" />
      </label>

      {!term && (
        <section aria-label="Kategori bantuan" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="choice" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? '' : c.id)} style={{ gap: 8, minHeight: 116 }}>
              <IconTile name={c.icon} tone={c.tone} size={40} />
              <strong style={{ fontSize: 14 }}>{c.title}</strong>
              <span className="hint" style={{ fontSize: 12 }}>{c.sub}</span>
            </button>
          ))}
        </section>
      )}

      {(term || cat) && (
        <section className="card menu-list" aria-label={term ? 'Hasil pencarian' : current?.title}>
          <strong style={{ fontSize: 14, padding: '12px 0 4px' }}>{term ? `Hasil untuk "${q.trim()}"` : current?.title}</strong>
          {found.length === 0 && <span className="hint" style={{ padding: '10px 0 14px' }}>Tidak ada panduan yang cocok. Coba kata lain atau hubungi CS di bawah.</span>}
          {found.map((t) => (
            <Link key={t.id} href={`/app/bantuan/${t.id}`}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span>{t.title}</span>
                <span className="hint" style={{ fontWeight: 500 }}>{t.summary}</span>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
        </section>
      )}

      {!term && !cat && (
        <section className="card menu-list" aria-label="Masalah yang sering ditanyakan">
          <strong style={{ fontSize: 14, padding: '12px 0 4px' }}>Sering ditanyakan</strong>
          {['dana-belum-masuk', 'edc-offline', 'kertas-struk', 'status-transaksi'].map((id) => TOPICS.find((t) => t.id === id)!).map((t) => (
            <Link key={t.id} href={`/app/bantuan/${t.id}`}>{t.title}<Icon name="chevron" size={18} /></Link>
          ))}
        </section>
      )}

      {recent.length > 0 && (
        <section className="card" style={{ gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Permintaan bantuan saya</strong>
          {recent.map((r) => (
            <Link key={r.number} href={`/app/bantuan/${r.topicId}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--ink)', textDecoration: 'none', padding: '6px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong>{r.topic}</strong><span className="hint">{r.number} · {r.at}</span></span>
              <span className={`tag${r.open ? '' : ' ok'}`} style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>{r.status}</span>
            </Link>
          ))}
        </section>
      )}

      <section className="card" style={{ gap: 10 }}>
        <strong style={{ fontSize: 14 }}>Masih butuh bantuan?</strong>
        <span className="hint">Coba panduan di atas dulu. Jika belum teratasi, CS AIPOS siap memandu lewat telepon.</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="btn btn-ghost" style={{ flex: 1, gap: 6 }} href={`tel:+${CS_WHATSAPP}`}><Icon name="call" size={18} />Telepon CS</a>
          <a className="btn btn-ghost" style={{ flex: 1, gap: 6 }} href={`https://wa.me/${CS_WHATSAPP}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} />WhatsApp</a>
        </div>
        <span className="hint" style={{ textAlign: 'center' }}>CS AIPOS · {CS_WHATSAPP_DISPLAY}</span>
      </section>
    </main>
  );
}
