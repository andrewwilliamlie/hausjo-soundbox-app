'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { phoneOk, waNumber, waText } from '@/lib/invoice';
import { useToast } from '../../../Sheets';
import { drawInvoice, type DrawInvoice, type DrawShop } from './draw';

function canShareFiles() {
  try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 't.png', { type: 'image/png' })] })); } catch { return false; }
}

export default function ShareClient({ id, inv, shop, qrisUrl, just }: { id: string; inv: DrawInvoice; shop: DrawShop; qrisUrl: string | null; just: '' | 'new' | 'edit' }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [shareable, setShareable] = useState(false);
  const [toast, setToast] = useToast();
  const text = waText(inv, shop.name, !!qrisUrl);
  const file = `${inv.number}.png`;

  useEffect(() => {
    setShareable(canShareFiles());
    let u: string | null = null;
    drawInvoice(inv, shop, qrisUrl)
      .then((b) => { setBlob(b); u = URL.createObjectURL(b); setUrl(u); })
      .catch(() => setFailed(true));
    return () => { if (u) URL.revokeObjectURL(u); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function share() {
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], file, { type: 'image/png' })], text });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setToast('Gagal membagikan. Simpan gambar lalu kirim manual.');
    }
  }
  function save() {
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = file; a.click();
    setToast('Gambar invoice disimpan');
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setToast('Pesan disalin'); } catch { setToast('Tidak bisa menyalin di perangkat ini'); }
  }

  return (
    <main className="app-sheet inner">
      {just && <div className="okmsg fade-in" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--ok-soft)', padding: '10px 12px', borderRadius: 12 }}><Icon name="checkCircle" size={20} />Invoice berhasil {just === 'edit' ? 'diperbarui' : 'dibuat'}</div>}
      {!qrisUrl && <div className="note">QRIS Anda belum aktif, jadi gambar invoice belum memuat kode QRIS. Setelah aktif, QRIS terlampir otomatis.</div>}

      <div className="inv-preview">
        {url ? <img src={url} alt={`Invoice ${inv.number} untuk ${inv.customerName}`} /> : failed ? <span className="err">Gambar invoice gagal dibuat. Muat ulang halaman.</span> : <span className="spin" style={{ width: 28, height: 28 }} aria-label="Menyiapkan gambar" />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shareable && <button type="button" className="btn btn-primary btn-block" disabled={!blob} onClick={share} style={{ gap: 8, background: '#128c4b' }}><Icon name="whatsapp" size={20} />Bagikan invoice + QRIS</button>}
        <button type="button" className={`btn btn-block ${shareable ? 'btn-ghost' : 'btn-primary'}`} disabled={!blob} onClick={save} style={{ gap: 8 }}><Icon name="download" size={18} />Simpan gambar invoice</button>
        {phoneOk(inv.customerPhone) && (
          <a className="btn btn-ghost btn-block" href={`https://wa.me/${waNumber(inv.customerPhone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" style={{ gap: 8 }}>
            <Icon name="whatsapp" size={18} />Kirim pesan ke {inv.customerName.split(' ')[0]}
          </a>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={copy} style={{ gap: 8 }}><Icon name="file" size={18} />Salin pesan</button>
      </div>

      <section className="card" style={{ gap: 6 }}>
        <strong style={{ fontSize: 14 }}>Cara kirim ke pelanggan</strong>
        {shareable
          ? <span className="hint">Tekan <b>Bagikan invoice + QRIS</b>, pilih WhatsApp, lalu pilih chat pelanggan. Gambar dan pesan ikut terkirim.</span>
          : <span className="hint">Simpan gambar invoice, lalu tekan <b>Kirim pesan</b> dan lampirkan gambarnya di chat WhatsApp.</span>}
      </section>
      <Link href={`/app/invoice/${id}`} className="btn btn-ghost">Lihat detail invoice</Link>
      {toast}
    </main>
  );
}
