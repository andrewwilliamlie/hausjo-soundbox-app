'use client';

import { useEffect, useState } from 'react';
import Icon, { IconTile, type IconName, type Tone } from '@/components/Icon';
import { BUSINESS_CATEGORIES } from '@/lib/provinces';

type Cat = (typeof BUSINESS_CATEGORIES)[number];
const find = (name: string) => BUSINESS_CATEGORIES.find((c) => c.name === name);

function Row({ c, selected, onPick, query }: { c: Cat; selected: boolean; onPick: () => void; query: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} className="cat-row tap" onClick={onPick}>
      <span className={`radio-dot${selected ? ' on' : ''}`} aria-hidden="true" />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
        <strong style={{ fontSize: 14.5 }}>{c.name}</strong>
        <span className="hint">{highlight(c.examples, query)}</span>
      </span>
      <IconTile name={c.icon as IconName} tone={c.tone as Tone} size={48} />
    </button>
  );
}

function highlight(text: string, q: string) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

/** "Jenis usaha" field: opens a full-screen list of categories with icons and examples, like GoPay Merchant. */
export default function BusinessTypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState(value);
  const current = find(value);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = q ? BUSINESS_CATEGORIES.filter((c) => (c.name + ' ' + c.examples).toLowerCase().includes(q)) : BUSINESS_CATEGORIES;

  return (
    <>
      <div className="field">
        <span>Jenis usaha</span>
        <button type="button" className="cat-field tap" onClick={() => { setPick(value); setQuery(''); setOpen(true); }} aria-haspopup="dialog">
          {current ? (
            <>
              <IconTile name={current.icon as IconName} tone={current.tone as Tone} size={40} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', minWidth: 0 }}>
                <strong style={{ fontSize: 14.5 }}>{current.name}</strong>
                <span className="hint" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.examples}</span>
              </span>
            </>
          ) : (
            <span style={{ flex: 1, textAlign: 'left', color: 'var(--muted)', fontWeight: 500 }}>{value ? `${value} · pilih ulang kategori` : 'Pilih jenis usaha'}</span>
          )}
          <Icon name="chevron" size={20} color="var(--muted)" />
        </button>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Pilih jenis usaha" className="cat-screen sheet-up">
          <header className="cat-head">
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Kembali"><Icon name="arrowLeft" size={22} /></button>
            <h2>Pilih jenis usaha</h2>
          </header>
          <div className="cat-warn"><Icon name="alert" size={18} color="#b54708" /><span><strong>Pilih jenis usaha yang sesuai.</strong> Ketidaksesuaian dapat menyebabkan penolakan saat verifikasi akun.</span></div>
          <div className="cat-body">
            <label className="search-pill" style={{ background: '#f2f5fa', border: 0 }}>
              <Icon name="search" size={18} color="var(--muted)" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cth: bengkel, laundry, toko baju" aria-label="Cari jenis usaha" />
            </label>
            <div role="radiogroup" aria-label="Jenis usaha" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map((c) => <Row key={c.name} c={c} selected={pick === c.name} onPick={() => setPick(c.name)} query={q} />)}
              {list.length === 0 && (
                <div className="empty-card">
                  <strong>Tidak ditemukan</strong>
                  <span className="hint">Pilih &ldquo;Lainnya&rdquo;, tim kami akan menyesuaikan kategorinya.</span>
                  <button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setPick('Lainnya'); }}>Pilih Lainnya</button>
                </div>
              )}
            </div>
          </div>
          <div className="cat-foot">
            <button type="button" className="btn btn-primary btn-block pill" disabled={!find(pick)} onClick={() => { onChange(pick); setOpen(false); }}>Lanjut</button>
          </div>
        </div>
      )}
    </>
  );
}
