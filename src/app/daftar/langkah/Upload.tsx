'use client';

import { useState } from 'react';
import Icon, { type IconName } from '@/components/Icon';

/** Shrinks a phone photo to at most 1600 px on the long side (JPEG) so uploads are fast and OCR stays within limits. */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.88));
    return blob && blob.size < file.size ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export function Upload({ kind, label, done, onDone, icon = 'upload', front = false, tall = false, extra }: {
  kind: string; label: string; done: boolean; icon?: IconName; front?: boolean; tall?: boolean;
  onDone: (ocr?: { fields: Record<string, string>; confidence: number } | null) => void;
  extra?: Record<string, string>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setBusy(true);
    setError('');
    const file = await shrink(picked);
    const local = URL.createObjectURL(file);
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('file', file);
    for (const [k, v] of Object.entries(extra ?? {})) fd.append(k, v);
    try {
      const res = await fetch('/api/app/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah');
      setPreview(local);
      onDone(json.ocr);
    } catch (err) {
      URL.revokeObjectURL(local);
      setError((err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }
  const cls = busy ? 'upload busy' : done ? 'upload done' : 'upload';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className={cls} style={{ minHeight: tall ? 150 : 116 }}>
        <input type="file" accept="image/jpeg,image/png,image/webp" capture={front ? 'user' : 'environment'} onChange={pick} aria-label={label} disabled={busy} />
        {preview && done && !busy && (
          <img src={preview} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
        )}
        {busy && <span className="scanline" aria-hidden="true" />}
        <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {done && !busy ? <span className="donemark"><Icon name="check" size={18} strokeWidth={3} /></span> : <Icon name={icon} size={28} />}
          <span>{label}</span>
          <span style={{ fontSize: 11.5, fontWeight: 500 }}>{busy ? (kind === 'KTP' ? 'Membaca e-KTP…' : 'Mengunggah…') : done ? 'Terunggah · ketuk untuk ganti' : 'Ketuk untuk ambil foto'}</span>
        </span>
      </label>
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}

