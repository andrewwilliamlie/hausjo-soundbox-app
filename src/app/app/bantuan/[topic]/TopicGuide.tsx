'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { CS_HOURS, CS_WHATSAPP, waLink } from '@/lib/contact';
import { CALL_TIMES, type HelpTopic } from '@/lib/help';
import { requestCall } from '../actions';

export default function TopicGuide({ topic, phone, store }: { topic: HelpTopic; phone: string; store: string }) {
  const [done, setDone] = useState<boolean[]>(topic.steps.map(() => false));
  const [answer, setAnswer] = useState<'' | 'yes' | 'no'>(topic.request && !topic.action ? 'no' : '');
  const [form, setForm] = useState({ phone, callTime: CALL_TIMES[0], note: '' });
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const tried = done.filter(Boolean).length;

  function send() {
    setError('');
    start(async () => {
      const r = await requestCall({ topic: topic.id, ...form, triedSteps: tried });
      if (!r.ok) return setError(r.error);
      setSent(r.number);
    });
  }

  const wa = waLink(`Halo AIPOS, saya butuh bantuan: ${topic.title}${store ? ` (toko ${store})` : ''}. Saya sudah mencoba ${tried} dari ${topic.steps.length} langkah panduan di aplikasi.`);

  return (
    <main className="app-sheet inner" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p className="note" style={{ margin: 0 }}>{topic.summary}</p>

      <section className="card" style={{ gap: 4 }}>
        <strong style={{ fontSize: 15, marginBottom: 6 }}>{topic.request ? 'Caranya' : 'Coba langkah ini dulu'}</strong>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {topic.steps.map((s, i) => (
            <li key={i} style={{ borderTop: i ? '1px solid var(--line)' : 0 }}>
              <button type="button" onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} aria-pressed={done[i]}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '12px 0', cursor: 'pointer', font: 'inherit', color: 'var(--ink)' }}>
                <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: done[i] ? 'var(--ok)' : 'var(--tile)', color: done[i] ? '#fff' : 'var(--blue)' }}>
                  {done[i] ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, textDecoration: done[i] ? 'line-through' : 'none', color: done[i] ? 'var(--muted)' : 'var(--ink)' }}>{s}</span>
              </button>
            </li>
          ))}
        </ol>
        {!topic.request && <span className="hint">Ketuk langkah yang sudah dicoba untuk menandainya.</span>}
        {topic.note && <p className="note" style={{ margin: '8px 0 0', background: 'var(--warn-soft)', color: 'var(--ink)' }}>{topic.note}</p>}
        {topic.action && <Link href={topic.action.href} className="btn btn-primary btn-block" style={{ marginTop: 10 }}>{topic.action.label}</Link>}
      </section>

      {!topic.request && !answer && (
        <section className="card" style={{ gap: 10, alignItems: 'center', textAlign: 'center' }}>
          <strong style={{ fontSize: 15 }}>Masalah sudah teratasi?</strong>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setAnswer('no')}>Belum</button>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setAnswer('yes')}>Ya, sudah</button>
          </div>
        </section>
      )}

      {answer === 'yes' && (
        <section className="card pop" style={{ gap: 6, alignItems: 'center', textAlign: 'center' }}>
          <Icon name="checkCircle" size={36} color="var(--ok)" />
          <strong style={{ fontSize: 15 }}>Syukurlah, masalah teratasi</strong>
          <Link href="/app/bantuan" className="hint">Kembali ke Bantuan</Link>
        </section>
      )}

      {(answer === 'no' || (topic.request && topic.action)) && !sent && (
        <section className={`card${answer === 'no' && !topic.request ? ' pop' : ''}`} style={{ gap: 12 }}>
          <strong style={{ fontSize: 15 }}>{topic.request && topic.action ? 'Butuh dibantu CS?' : 'Hubungi CS AIPOS'}</strong>
          <span className="hint">CS memandu Anda langkah demi langkah lewat telepon. Pilih telepon sekarang, atau minta CS menelepon Anda.</span>
          <span className="note" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="clock" size={18} color="var(--blue)" />Jam operasional CS: {CS_HOURS}</span>
          <a className="btn btn-primary btn-block" href={`tel:+${CS_WHATSAPP}`} style={{ gap: 8 }}><Icon name="call" size={18} />Telepon CS sekarang</a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <strong style={{ fontSize: 14 }}>Minta CS menelepon saya</strong>
            <label className="field">Nomor HP yang bisa ditelepon
              <input className="input" value={form.phone} inputMode="tel" maxLength={16} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+]/g, '') })} />
            </label>
            <span className="field" style={{ gap: 8 }}>Waktu yang cocok
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CALL_TIMES.map((t) => <button key={t} type="button" className="chip" aria-pressed={form.callTime === t} onClick={() => setForm({ ...form, callTime: t })}>{t}</button>)}
              </span>
            </span>
            <label className="field">Ceritakan singkat masalahnya <span className="hint" style={{ fontWeight: 500 }}>(opsional)</span>
              <textarea className="input" rows={3} maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Misal: EDC menampilkan pesan 'koneksi gagal' sejak pagi" />
            </label>
            {error && <p className="err" role="alert">{error}</p>}
            <button type="button" className="btn btn-ghost btn-block" disabled={pending} onClick={send}>{pending ? 'Mengirim…' : 'Kirim permintaan telepon'}</button>
          </div>
          <a href={wa} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 700 }}><Icon name="whatsapp" size={16} />Atau chat lewat WhatsApp</a>
        </section>
      )}

      {sent && (
        <section className="card pop" style={{ gap: 6, alignItems: 'center', textAlign: 'center' }}>
          <Icon name="checkCircle" size={36} color="var(--ok)" />
          <strong style={{ fontSize: 15 }}>Permintaan terkirim · {sent}</strong>
          <span className="hint">CS AIPOS akan menelepon {form.phone} ({form.callTime.toLowerCase()}) pada jam operasional: {CS_HOURS}. Pastikan HP Anda aktif.</span>
          <Link href="/app/bantuan" className="hint">Kembali ke Bantuan</Link>
        </section>
      )}
    </main>
  );
}
