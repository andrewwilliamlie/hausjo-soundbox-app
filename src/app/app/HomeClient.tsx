'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import Icon, { IconTile, type IconName } from '@/components/Icon';
import SoundboxArt from '@/components/SoundboxArt';
import { BANKS, MARKETPLACES } from '@/lib/provinces';
import { Upload } from '../daftar/langkah/Upload';
import { saveBank, setSoundbox, submitSerial, type Result } from './actions';

type AppView = {
  ticket: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVISION' | 'BANK' | 'ACTIVE' | 'REJECTED';
  product: 'SOUNDBOX' | 'QRIS';
  soundboxStatus: 'NONE' | 'BUY' | 'MARKETPLACE' | 'SALES' | 'ARRIVED';
  bankSet: boolean;
  bankLabel: string;
  settlement: 'H1' | 'SAME_DAY';
  holderDefault: string;
  stickerId: string | null;
  serialNumber: string | null;
  needsGuide: boolean;
  rejected: Array<{ kind: string; label: string; reason: string }>;
  nmid: string | null;
};

const SB_SUB: Record<AppView['soundboxStatus'], string> = {
  NONE: 'Rp349.000 sekali bayar, opsional',
  BUY: 'Dipesan · link pembayaran dikirim setelah disetujui',
  MARKETPLACE: 'Pesanan marketplace dicocokkan admin',
  SALES: 'Pesanan lewat sales dicocokkan admin',
  ARRIVED: 'Diterima · CS akan memandu aktivasi'
};

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

export default function HomeClient({ app, isNew }: { app: AppView; isNew: boolean }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<'' | 'bank' | 'sb'>('');
  const [toast, setToast] = useState(isNew ? 'Pendaftaran terkirim! Nomor tiket ' + app.ticket : '');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const [bank, setBank] = useState({ bankName: 'BCA', accountNo: '', accountHolder: app.holderDefault, settlement: app.settlement as 'H1' | 'SAME_DAY' });
  const [way, setWay] = useState<'buy' | 'market' | 'sales' | 'arrived'>('buy');
  const [sbForm, setSbForm] = useState({ marketplace: MARKETPLACES[0], orderNo: '', salesName: '', serial: '' });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function run(fn: () => Promise<Result>) {
    setError('');
    start(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error || 'Terjadi kesalahan');
      setSheet('');
      setToast(r.message || 'Tersimpan');
      router.refresh();
    });
  }

  const active = app.status === 'ACTIVE';
  const sbDone = app.soundboxStatus !== 'NONE';
  const tasks = [
    { name: 'Data pendaftaran terkirim', sub: 'Foto e-KTP, selfie dan data usaha', done: true, tag: 'Selesai', icon: 'ktp' as IconName, open: null as null | (() => void) },
    { name: 'Tambah rekening pencairan', sub: app.bankSet ? `${app.bankLabel} · cair ${app.settlement === 'H1' ? 'H+1' : 'hari yang sama'}` : 'Supaya QRIS bisa diterbitkan bank', done: app.bankSet, tag: app.bankSet ? 'Selesai' : 'Wajib', icon: 'bank' as IconName, open: active || app.status === 'BANK' ? null : () => setSheet('bank') },
    { name: 'Soundbox', sub: !sbDone && app.product === 'SOUNDBOX' ? 'Pilih: beli sekarang, sudah beli di marketplace/sales, atau sudah sampai' : SB_SUB[app.soundboxStatus], done: sbDone, tag: sbDone ? 'Selesai' : app.product === 'SOUNDBOX' ? 'Pilih' : 'Opsional', icon: 'speaker' as IconName, open: () => setSheet('sb') },
    { name: 'QRIS siap dipakai', sub: active ? 'Aktif · unduh stiker di atas' : app.bankSet ? 'Diterbitkan bank 1–2 hari kerja' : 'Terbuka setelah rekening ditambahkan', done: active, tag: '', icon: 'qris' as IconName, open: null }
  ];
  const doneCount = tasks.filter((t) => t.done).length;

  let statusTitle = 'Pendaftaran sedang diproses';
  let statusSub = 'Admin memeriksa data Anda, biasanya 1–2 hari kerja.';
  if (!app.bankSet && !active) { statusTitle = 'Menunggu rekening'; statusSub = 'Data Anda sedang diperiksa. Tambahkan rekening agar QRIS bisa diterbitkan.'; }
  if (app.status === 'REVISION') { statusTitle = 'Perlu revisi'; statusSub = 'Ganti foto yang ditandai di bawah. Foto lain sudah disetujui.'; }
  if (app.status === 'BANK') { statusTitle = 'Diproses bank'; statusSub = 'Data sudah dikirim ke bank. QRIS terbit dalam 1–2 hari kerja.'; }
  if (app.status === 'REJECTED') { statusTitle = 'Pendaftaran ditolak'; statusSub = 'Hubungi CS HausJo untuk informasi lebih lanjut.'; }

  return (
    <main className="content" style={{ position: 'relative' }}>
      {active ? (
        <section className="hero rise" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <span className="pop" style={{ width: 56, height: 56, borderRadius: 16, background: '#12b76a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="qris" size={30} color="#fff" /></span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <strong style={{ fontSize: 17 }}>QRIS Anda aktif</strong>
            <span style={{ fontSize: 12.5, color: '#dce6fa' }}>NMID {app.nmid} · {app.bankLabel} · cair {app.settlement === 'H1' ? 'H+1' : 'hari yang sama'}</span>
            {app.stickerId && <a className="btn btn-primary" style={{ gap: 8, background: '#fff', color: 'var(--navy)' }} href={`/api/files/${app.stickerId}?download=1`}><Icon name="download" size={18} />Unduh &amp; cetak stiker QRIS</a>}
          </div>
        </section>
      ) : (
        <section className="card rise" style={{ gap: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <IconTile name={app.status === 'REVISION' ? 'upload' : app.status === 'BANK' ? 'bank' : !app.bankSet ? 'wallet' : 'clock'} tone={app.status === 'REVISION' || (!app.bankSet && app.status !== 'REJECTED') ? 'orange' : 'blue'} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 15 }}>{statusTitle}</strong><span className="hint">{statusSub}</span></span>
          </div>
          {!app.bankSet && app.status !== 'REJECTED' && (
            <>
              <button type="button" className="btn btn-primary" style={{ gap: 8 }} onClick={() => setSheet('bank')}><Icon name="plus" size={18} />Tambah rekening sekarang</button>
              <span className="hint">QRIS (NMID) hanya bisa diterbitkan bank setelah rekening ditambahkan.</span>
            </>
          )}
          <span className="hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="card" size={14} />Tiket {app.ticket}</span>
        </section>
      )}

      {app.status === 'REVISION' && app.rejected.length > 0 && (
        <section className="card rise rise-1" style={{ background: '#fffaeb', borderColor: '#fec84b', gap: 12 }}>
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
        <section className="card rise rise-1" style={{ gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="h2" style={{ fontSize: 16 }}>Aktifkan toko Anda</h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{doneCount}/4 selesai</span>
          </div>
          <div className="bar" aria-hidden="true"><span style={{ width: `${(doneCount / 4) * 100}%` }} /></div>
          {tasks.map((t) => (
            <button key={t.name} type="button" className="tap" disabled={!t.open} onClick={() => t.open?.()}
              style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: '12px 0', border: 0, borderBottom: '1px solid var(--line)', background: 'none', color: 'var(--ink)', cursor: t.open ? 'pointer' : 'default', minHeight: 56 }}>
              <span aria-hidden="true" className={`task-dot ${t.done ? 'done' : t.open ? 'todo' : 'lock'}`} style={{ width: 36, height: 36 }}>
                <Icon name={t.done ? 'check' : t.open ? t.icon : 'lock'} size={18} strokeWidth={t.done ? 3 : 2} />
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{t.name}</strong><span className="hint">{t.sub}</span></span>
              {t.tag && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: t.done ? 'var(--ok-soft)' : t.tag === 'Wajib' ? 'var(--err-soft)' : 'var(--blue-soft)', color: t.done ? 'var(--ok)' : t.tag === 'Wajib' ? 'var(--err)' : '#1f4fb0' }}>{t.tag}</span>}
              {t.open && <Icon name="chevron" size={18} color="var(--muted)" />}
            </button>
          ))}
        </section>
      )}

      {!active && app.product === 'SOUNDBOX' && !sbDone && (
        <button type="button" className="hero rise rise-2 tap" onClick={() => setSheet('sb')} style={{ textAlign: 'left', border: 0, cursor: 'pointer', gap: 4 }}>
          <span className="eyebrow" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#bfd4ff' }}>SOUNDBOX QRIS</span>
          <strong style={{ fontSize: 17 }}>Atur Soundbox Anda</strong>
          <span style={{ fontSize: 13, color: '#dce6fa', lineHeight: 1.5 }}>Beli sekarang, sudah pesan di marketplace/sales, atau sudah sampai.</span>
          <SoundboxArt compact />
          <span className="btn btn-primary btn-block" style={{ gap: 6 }}>Pilih <Icon name="chevron" size={18} /></span>
        </button>
      )}

      {active && app.product === 'SOUNDBOX' && app.soundboxStatus !== 'ARRIVED' && (
        <button type="button" onClick={() => { setWay('arrived'); setSheet('sb'); }} className="card tap rise rise-1" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile name="scan" tone="orange" />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><strong>Soundbox sudah sampai?</strong>
          <span className="hint">Pindai SN Soundbox, CS akan memandu aktivasi dan cara pakai.</span></span>
          <Icon name="chevron" size={18} color="var(--muted)" />
        </button>
      )}
      {app.needsGuide && <div className="note fade-in" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="whatsapp" size={20} />SN {app.serialNumber} tercatat. CS HausJo akan menghubungi Anda lewat WhatsApp.</div>}

      {toast && <div role="status" className="toast" style={{ position: 'sticky', bottom: 12, background: 'var(--navy)', color: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 13, fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 8px 24px rgba(11,34,83,.3)' }}><Icon name="checkCircle" size={20} color="#6ce9a6" />{toast}</div>}

      {sheet && (
        <div role="dialog" aria-modal="true" aria-label={sheet === 'bank' ? 'Rekening pencairan' : 'Soundbox'} style={{ position: 'fixed', inset: 0, background: 'rgba(11,27,58,.45)', animation: 'fadeIn .2s ease-out', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10 }} onClick={(e) => { if (e.target === e.currentTarget) setSheet(''); }}>
          <div className="sheet-up" style={{ background: '#fff', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: '10px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, background: 'var(--line-2)' }} />
            {sheet === 'bank' && (
              <>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><IconTile name="bank" /><h2 className="h2" style={{ fontSize: 19 }}>Rekening pencairan</h2></div>
                <p className="hint">Wajib agar QRIS bisa diterbitkan. Bisa bank apa saja.</p>
                <label className="field">Bank<select className="input" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
                <label className="field">Nomor rekening<input className="input" inputMode="numeric" value={bank.accountNo} onChange={(e) => setBank({ ...bank, accountNo: e.target.value })} /></label>
                <label className="field">Nama pemilik rekening<input className="input ocr" value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} /><span className="hint">Harus sama dengan nama di e-KTP.</span></label>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Kapan uang dicairkan?</span>
                {([['H1', 'clock', 'H+1 (disarankan)', 'MDR 0% di bawah Rp500.000, 0,3% mulai Rp500.000. Rp2.000 per pencairan.'], ['SAME_DAY', 'sun', 'Hari yang sama', 'MDR 0,7%, tanpa biaya pencairan.']] as const).map(([v, ic, t, s]) => (
                  <button key={v} type="button" role="radio" aria-checked={bank.settlement === v} className="choice" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onClick={() => setBank({ ...bank, settlement: v })}><Icon name={ic} size={24} color={bank.settlement === v ? 'var(--blue)' : 'var(--muted)'} /><span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{s}</span></span></button>
                ))}
                {error && <p className="err" role="alert">{error}</p>}
                <button type="button" className="btn btn-primary" disabled={pending} onClick={() => run(() => saveBank(bank))}>{pending ? 'Menyimpan…' : 'Simpan rekening'}</button>
              </>
            )}
            {sheet === 'sb' && (
              <>
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{MARKETPLACES.map((m) => <button key={m} type="button" className="chip" aria-pressed={sbForm.marketplace === m} onClick={() => setSbForm({ ...sbForm, marketplace: m })}>{m}</button>)}</div>
                    <label className="field">No. Pesanan<input className="input" value={sbForm.orderNo} onChange={(e) => setSbForm({ ...sbForm, orderNo: e.target.value })} /></label>
                  </>
                )}
                {way === 'sales' && <label className="field">Nama sales HausJo<input className="input" value={sbForm.salesName} onChange={(e) => setSbForm({ ...sbForm, salesName: e.target.value })} /></label>}
                {way === 'arrived' && (
                  <>
                    <p className="hint">Pindai barcode SN di bagian bawah Soundbox. CS HausJo akan menghubungi Anda untuk memandu aktivasi dan cara pakai.</p>
                    <SerialScanner onResult={(v) => setSbForm((f) => ({ ...f, serial: v }))} />
                    <label className="field">Serial Number (SN)<input className="input" value={sbForm.serial} onChange={(e) => setSbForm({ ...sbForm, serial: e.target.value.toUpperCase() })} placeholder="Ketik SN jika tidak bisa dipindai" /></label>
                  </>
                )}
                {error && <p className="err" role="alert">{error}</p>}
                <button type="button" className="btn btn-primary" disabled={pending || (way === 'arrived' && !sbForm.serial)}
                  onClick={() => run(() => (way === 'arrived' ? submitSerial(sbForm.serial) : setSoundbox({ way, marketplace: sbForm.marketplace, orderNo: sbForm.orderNo, salesName: sbForm.salesName })))}>
                  {pending ? 'Menyimpan…' : way === 'buy' ? 'Pesan Soundbox' : way === 'market' ? 'Kirim No. Pesanan' : way === 'arrived' ? 'Minta panduan aktivasi' : 'Simpan'}
                </button>
              </>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setSheet('')}>Tutup</button>
          </div>
        </div>
      )}
    </main>
  );
}
