'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import Icon, { IconTile } from '@/components/Icon';
import SoundboxArt from '@/components/SoundboxArt';
import { BANKS, MARKETPLACES } from '@/lib/provinces';
import type { AppView } from '@/lib/merchant-view';
import { saveBank, setSoundbox, submitSerial, type Result } from './actions';

/** Bottom sheet with a dimmed backdrop; tap outside or "Tutup" to close. */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-up sheet-panel">
        <span aria-hidden="true" className="sheet-handle" />
        {children}
        <button type="button" className="btn btn-ghost" onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}

/** Small message that slides up and disappears after 4 s. */
export function useToast(initial = '') {
  const [toast, setToast] = useState(initial);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast ? (
    <div role="status" className="toast app-toast"><Icon name="checkCircle" size={20} color="#6ce9a6" />{toast}</div>
  ) : null;
  return [node, setToast] as const;
}

/** Runs a server action; on success closes the sheet, shows a toast and refreshes the page data. */
function useRun(onDone: (msg: string) => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  function run(fn: () => Promise<Result>) {
    setError('');
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error || 'Terjadi kesalahan');
      onDone(r.message || 'Tersimpan');
      router.refresh();
    });
  }
  return { run, pending, error };
}

export function BankSheet({ app, onClose, onSaved }: { app: AppView; onClose: () => void; onSaved: (msg: string) => void }) {
  const [bank, setBank] = useState({ bankName: app.bankName || 'BCA', accountNo: '', accountHolder: app.accountHolder || app.holderDefault, settlement: app.settlement });
  const { run, pending, error } = useRun((m) => { onClose(); onSaved(m); });
  return (
    <Sheet label="Rekening pencairan" onClose={onClose}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><IconTile name="bank" /><h2 className="h2" style={{ fontSize: 19 }}>Rekening pencairan</h2></div>
      <p className="hint">Wajib agar QRIS bisa diterbitkan. Bisa bank apa saja.</p>
      <label className="field">Bank<select className="input" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
      <label className="field">Nomor rekening<input className="input" inputMode="numeric" value={bank.accountNo} onChange={(e) => setBank({ ...bank, accountNo: e.target.value })} /></label>
      <label className="field">Nama pemilik rekening<input className="input ocr" value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} /><span className="hint">Harus sama dengan nama di e-KTP.</span></label>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Kapan uang dicairkan?</span>
      {([['H1', 'clock', 'H+1 (disarankan)', 'MDR 0% di bawah Rp500.000, 0,3% mulai Rp500.000. Rp2.000 per pencairan.'], ['SAME_DAY', 'sun', 'Hari yang sama', 'MDR 0,7%, tanpa biaya pencairan.']] as const).map(([v, ic, t, s]) => (
        <button key={v} type="button" role="radio" aria-checked={bank.settlement === v} className="choice" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onClick={() => setBank({ ...bank, settlement: v })}>
          <Icon name={ic} size={24} color={bank.settlement === v ? 'var(--blue)' : 'var(--muted)'} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{s}</span></span>
        </button>
      ))}
      {error && <p className="err" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={pending} onClick={() => run(() => saveBank(bank))}>{pending ? 'Menyimpan…' : 'Simpan rekening'}</button>
    </Sheet>
  );
}

/* Barcode scan with the browser's BarcodeDetector when available (Chrome on Android); manual entry otherwise. */
function SerialScanner({ onResult }: { onResult: (v: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'scanning' | 'unsupported'>('idle');
  useEffect(() => () => {
    const s = video.current?.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
  }, []);
  async function start() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BD = (window as any).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) return setState('unsupported');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!video.current) return;
      video.current.srcObject = stream;
      await video.current.play();
      setState('scanning');
      const detector = new BD();
      const tick = async () => {
        if (!video.current || video.current.srcObject !== stream) return;
        const codes = await detector.detect(video.current).catch(() => []);
        if (codes.length) {
          stream.getTracks().forEach((t) => t.stop());
          video.current.srcObject = null;
          setState('idle');
          onResult(String(codes[0].rawValue));
          return;
        }
        setTimeout(tick, 350);
      };
      tick();
    } catch {
      setState('unsupported');
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#0b1b3a', minHeight: state === 'scanning' ? 180 : 0 }}>
        <video ref={video} playsInline muted style={{ width: '100%', display: state === 'scanning' ? 'block' : 'none' }} />
      </div>
      {state !== 'scanning' && <button type="button" className="btn btn-ghost" onClick={start} style={{ gap: 8 }}><Icon name="scan" size={20} />Pindai barcode SN</button>}
      {state === 'unsupported' && <span className="hint">Pemindai tidak tersedia di perangkat ini. Ketik SN di bawah.</span>}
    </div>
  );
}

export type SbWay = 'buy' | 'market' | 'sales' | 'arrived';

export function SoundboxSheet({ initialWay = 'buy', onClose, onSaved }: { initialWay?: SbWay; onClose: () => void; onSaved: (msg: string) => void }) {
  const [way, setWay] = useState<SbWay>(initialWay);
  const [f, setF] = useState({ marketplace: MARKETPLACES[0], orderNo: '', salesName: '', serial: '' });
  const { run, pending, error } = useRun((m) => { onClose(); onSaved(m); });
  return (
    <Sheet label="Soundbox" onClose={onClose}>
      <SoundboxArt compact />
      <h2 className="h2" style={{ fontSize: 19, textAlign: 'center' }}>Soundbox QRIS · Rp349.000</h2>
      <p className="hint">Menyebut nominal setiap pembayaran QRIS. Sekali bayar, jadi milik Anda, tanpa sewa.</p>
      <div role="radiogroup" aria-label="Status Soundbox" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {([['buy', 'wallet', 'Beli sekarang'], ['market', 'store', 'Sudah beli di marketplace'], ['sales', 'selfie', 'Lewat sales'], ['arrived', 'box', 'Sudah sampai']] as const).map(([v, ic, t]) => (
          <button key={v} type="button" role="radio" className="choice" aria-checked={way === v} onClick={() => setWay(v)} style={{ alignItems: 'flex-start', gap: 6 }}>
            <Icon name={ic} size={22} color={way === v ? 'var(--blue)' : 'var(--muted)'} /><strong style={{ fontSize: 13.5 }}>{t}</strong>
          </button>
        ))}
      </div>
      {way === 'buy' && <p className="hint fade-in">Pembayaran lewat Doku. Link pembayaran dikirim setelah pendaftaran disetujui; Soundbox dikirim setelah QRIS aktif.</p>}
      {way === 'market' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{MARKETPLACES.map((m) => <button key={m} type="button" className="chip" aria-pressed={f.marketplace === m} onClick={() => setF({ ...f, marketplace: m })}>{m}</button>)}</div>
          <label className="field">No. Pesanan<input className="input" value={f.orderNo} onChange={(e) => setF({ ...f, orderNo: e.target.value })} /></label>
        </>
      )}
      {way === 'sales' && <label className="field">Nama sales HausJo<input className="input" value={f.salesName} onChange={(e) => setF({ ...f, salesName: e.target.value })} /></label>}
      {way === 'arrived' && (
        <>
          <p className="hint">Pindai barcode SN di bagian bawah Soundbox. CS HausJo akan menghubungi Anda untuk memandu aktivasi dan cara pakai.</p>
          <SerialScanner onResult={(v) => setF((x) => ({ ...x, serial: v }))} />
          <label className="field">Serial Number (SN)<input className="input" value={f.serial} onChange={(e) => setF({ ...f, serial: e.target.value.toUpperCase() })} placeholder="Ketik SN jika tidak bisa dipindai" /></label>
        </>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary" disabled={pending || (way === 'arrived' && !f.serial)}
        onClick={() => run(() => (way === 'arrived' ? submitSerial(f.serial) : setSoundbox({ way, marketplace: f.marketplace, orderNo: f.orderNo, salesName: f.salesName })))}>
        {pending ? 'Menyimpan…' : way === 'buy' ? 'Pesan Soundbox' : way === 'market' ? 'Kirim No. Pesanan' : way === 'arrived' ? 'Minta panduan aktivasi' : 'Simpan'}
      </button>
    </Sheet>
  );
}
