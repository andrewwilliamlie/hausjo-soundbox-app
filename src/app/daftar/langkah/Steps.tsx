'use client';

import { useState } from 'react';
import Icon, { IconTile } from '@/components/Icon';
import LiveSelfie from './LiveSelfie';
import { Upload } from './Upload';
import BusinessTypePicker from './BusinessTypePicker';
import { BANKS, BUSINESS_CATEGORIES } from '@/lib/provinces';
import RegionPicker, { matchRegion, type GeoAddress } from './RegionPicker';
import { checkBusinessName, checkNik } from '@/lib/rules';

const BUSINESS_NAMES: string[] = BUSINESS_CATEGORIES.map((c) => c.name);

type Data = {
  ktpName: string; nik: string; birthPlace: string; birthDate: string; gender: string; ktpAddress: string;
  ocrConfidence: number | null;
  hasStore: boolean; sellsOffline: boolean; sellsOnline: boolean; onlineLink: string;
  businessType: string; businessName: string;
  street: string; number: string; rt: string; rw: string; kelurahan: string; kecamatan: string; city: string; province: string; postalCode: string; villageCode: string;
  lat: number | null; lng: number | null; turnover: string;
  bankName: string; accountNo: string; accountHolder: string; settlement: 'H1' | 'SAME_DAY';
};

/** A payout account already used by another store of the same owner (number shown masked). */
export type KnownBank = { fromId: string; label: string; holder: string };

const OCR_KEYS = ['ktpName', 'nik', 'birthPlace', 'birthDate', 'ktpAddress'] as const;
const TURNOVER: Array<[string, string]> = [
  ['UMI', 'Di bawah Rp2 miliar/tahun (Usaha Mikro)'],
  ['UKE', 'Rp2–15 miliar/tahun (Usaha Kecil)'],
  ['UME', 'Rp15–50 miliar/tahun (Usaha Menengah)'],
  ['UBE', 'Di atas Rp50 miliar/tahun']
];

const CONFETTI: Array<[number, string, number]> = [
  [-140, '#1f5fd6', 0], [-100, '#12b76a', .05], [-60, '#f79009', .1], [-25, '#8db4ff', 0], [20, '#0b2253', .08],
  [55, '#f79009', .02], [95, '#1f5fd6', .12], [135, '#12b76a', .04], [-120, '#f79009', .15], [115, '#8db4ff', .18]
];

async function post(url: string, body?: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan, coba lagi');
  return json;
}

export default function Steps({ initial, uploaded, product, startStep = 0, knownBanks = [] }: { initial: Data; uploaded: Record<string, boolean>; product: string; startStep?: number; knownBanks?: KnownBank[] }) {
  const [step, setStep] = useState(startStep); // 0 intro, 1 KTP, 2 usaha, 3 rekening, 4 konfirmasi, 5 terkirim
  // Payout account: reuse one from another store of this owner, or type a new one.
  const [bankChoice, setBankChoice] = useState<string>(initial.accountNo ? 'other' : knownBanks.length ? '' : 'other');
  const [d, setD] = useState<Data>(initial);
  const [up, setUp] = useState<Record<string, boolean>>(uploaded);
  const [ocrFilled, setOcrFilled] = useState(initial.ocrConfidence != null);
  const [ocrEdited, setOcrEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const [ticket, setTicket] = useState('');
  const [locMsg, setLocMsg] = useState(initial.lat != null ? 'Lokasi toko tersimpan. Periksa alamat di bawah.' : '');
  const [locMode, setLocMode] = useState<'' | 'gps' | 'manual'>(initial.lat != null ? 'gps' : initial.province ? 'manual' : '');
  const [locBusy, setLocBusy] = useState(false);

  const set = <K extends keyof Data>(k: K, v: Data[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    if (ocrFilled && (OCR_KEYS as readonly string[]).includes(k as string)) setOcrEdited(true);
  };

  const name = checkBusinessName(d.businessName);
  const nik = checkNik(d.nik);

  function payload(s: number) {
    if (s === 1) return { ktpName: d.ktpName, nik: d.nik, birthPlace: d.birthPlace, birthDate: d.birthDate, gender: d.gender, ktpAddress: d.ktpAddress, ocrEdited };
    if (s === 2) {
      const { ktpName, nik: _n, birthPlace, birthDate, gender, ktpAddress, ocrConfidence, lat, lng, ...rest } = d;
      // Manual address: the GPS point is cleared so the store pin is never somewhere else.
      return { ...rest, lat: locMode === 'gps' ? lat : null, lng: locMode === 'gps' ? lng : null };
    }
    if (s === 3) {
      const base = { settlement: d.settlement };
      if (bankChoice.startsWith('same:')) return { ...base, copyBankFrom: bankChoice.slice(5) };
      return { ...base, bankName: d.bankName, accountNo: d.accountNo.replace(/\D/g, ''), accountHolder: d.accountHolder.trim().toUpperCase() };
    }
    return undefined;
  }

  function validate(s: number): string {
    if (s === 1) {
      if (!up.KTP) return 'Unggah foto e-KTP';
      if (!up.SELFIE) return 'Unggah selfie dengan e-KTP';
      if (!d.ktpName.trim()) return 'Isi nama sesuai e-KTP';
      if (!nik.ok) return 'NIK harus 16 digit angka';
    }
    if (s === 2) {
      if (!d.businessType) return 'Pilih jenis usaha';
      if (!BUSINESS_NAMES.includes(d.businessType)) return 'Pilih ulang jenis usaha dari daftar kategori';
      if (!name.ok) return 'Periksa nama usaha: ' + name.message;
      if (!locMode) return 'Pilih alamat toko: lokasi saya sekarang atau lokasi lain';
      if (!d.province || !d.city || !d.kecamatan || !d.villageCode) return 'Pilih provinsi, kota, kecamatan dan kelurahan/desa dari daftar';
      if (!/^\d{5}$/.test(d.postalCode)) return 'Kode pos harus 5 angka';
      if (!d.street.trim()) return 'Isi nama jalan toko';
      if (!up.STORE_FRONT || !up.PRODUCT) return 'Unggah foto depan toko dan foto produk';
      if (d.sellsOnline && !d.onlineLink.trim()) return 'Isi link toko online';
    }
    if (s === 3) {
      if (!bankChoice) return 'Pilih rekening yang sama atau rekening lain';
      if (bankChoice === 'other') {
        if (!d.bankName) return 'Pilih bank';
        if (!/^\d{6,20}$/.test(d.accountNo.replace(/\D/g, ''))) return 'Nomor rekening hanya angka (6–20 digit)';
        if (d.accountHolder.trim().length < 3) return 'Isi nama pemilik rekening';
      }
    }
    return '';
  }

  async function next() {
    setError('');
    const v = validate(step);
    if (v) return setError(v);
    setBusy(true);
    try {
      const body = payload(step);
      if (body) await post('/api/app/save', body);
      if (step === 4) {
        const res = await post('/api/app/submit');
        setTicket(res.ticket || '');
        setStep(5);
        window.scrollTo({ top: 0 });
        return;
      }
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const blankAddress = { province: '', city: '', kecamatan: '', kelurahan: '', postalCode: '', villageCode: '', street: '', number: '', rt: '', rw: '' };

  /** "Lokasi saya sekarang": GPS point → address via the server → matched to the region lists → fields filled in. */
  function pickMyLocation() {
    setLocMode('gps');
    if (!navigator.geolocation) return setLocMsg('Lokasi tidak tersedia di perangkat ini. Pilih "Lokasi lain" dan isi manual.');
    setLocBusy(true);
    setLocMsg('Mencari lokasi Anda…');
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude: lat, longitude: lng, accuracy } = p.coords;
        setD((x) => ({ ...x, lat, lng }));
        setLocMsg('Membaca alamat…');
        const weak = accuracy > 150 ? ` Akurasi GPS rendah (±${Math.round(accuracy)} m), periksa lagi.` : '';
        try {
          const res = await fetch('/api/geo/reverse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng }) });
          const g = (await res.json()) as GeoAddress & { street?: string; number?: string; error?: string };
          if (!res.ok) throw new Error(g.error || 'gagal');
          const { region, levels } = await matchRegion(g);
          setD((x) => ({ ...x, ...blankAddress, ...region, street: g.street ?? '', number: g.number ?? '', lat, lng }));
          setLocMsg(levels >= 4
            ? `Alamat terisi dari lokasi Anda. Periksa, lalu isi RT/RW.${weak}`
            : `Sebagian alamat terisi. Lengkapi bagian yang kosong.${weak}`);
        } catch {
          setLocMsg(`Titik lokasi tersimpan, tapi alamat tidak bisa dibaca otomatis. Isi alamat di bawah.${weak}`);
        } finally {
          setLocBusy(false);
        }
      },
      (err) => {
        setLocBusy(false);
        setLocMode('');
        setLocMsg(err.code === err.PERMISSION_DENIED
          ? 'Izin lokasi ditolak. Izinkan lokasi di browser, atau pilih "Lokasi lain".'
          : 'Lokasi belum ditemukan. Coba lagi di luar ruangan, atau pilih "Lokasi lain".');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  /** "Lokasi lain": the store is somewhere else, so no GPS point and the merchant types the address. */
  function pickOtherLocation() {
    if (locMode === 'gps') setD((x) => ({ ...x, ...blankAddress, lat: null, lng: null }));
    setLocMode('manual');
    setLocMsg('');
  }

  const labels = ['Foto e-KTP & selfie', 'Data usaha', 'Rekening', 'Konfirmasi'];

  return (
    <main className="content">
      {step > 0 && step < 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="hint" style={{ fontWeight: 600 }}>Langkah {step} dari 4 · {labels[step - 1]}</span>
          <div className="steps" aria-hidden="true">{labels.map((_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div>
        </div>
      )}

      {step === 0 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>4 langkah, sekitar 5 menit</h1>
          <p className="hint" style={{ fontSize: 13.5 }}>Lakukan di toko Anda dan siapkan e-KTP asli.</p>
          {([['ktp', 'blue', '1 · Foto e-KTP & selfie', 'Data KTP terbaca otomatis bila tersedia'], ['store', 'orange', '2 · Data usaha', 'Lokasi toko dan foto toko'], ['bank', 'purple', '3 · Rekening', 'Tujuan pencairan uang QRIS'], ['checkCircle', 'green', '4 · Konfirmasi', 'Periksa, lalu kirim sekali']] as const).map(([ic, tone, t, s], i) => (
            <div key={t} className={`card rise rise-${i + 1}`} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile name={ic} tone={tone} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 15 }}>{t}</strong><span className="hint">{s}</span></span>
            </div>
          ))}
          <div className="note rise rise-4">Siapkan e-KTP dan nomor rekening. Setelah dikirim, Anda langsung masuk aplikasi{product === 'SOUNDBOX' ? ' dan bisa mengurus Soundbox' : ''} sambil kami memeriksa data.</div>
        </div>
      )}

      {step === 1 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Foto e-KTP &amp; selfie</h1>
          <p className="hint">Foto di tempat terang, seluruh KTP terlihat, tidak buram.</p>
          <Upload kind="KTP" label="Foto e-KTP" icon="ktp" tall done={!!up.KTP} onDone={(ocr) => {
            setUp((u) => ({ ...u, KTP: true }));
            if (ocr) { setD((x) => ({ ...x, ...(ocr.fields as unknown as Partial<Data>) })); setOcrFilled(true); setOcrEdited(false); }
          }} />
          {ocrFilled && <span className="okmsg fade-in" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="spark" size={16} />Terbaca otomatis. Periksa dan ubah jika ada yang salah.</span>}
          <label className="field">Nama lengkap sesuai e-KTP<input className={ocrFilled ? 'input ocr' : 'input'} value={d.ktpName} onChange={(e) => set('ktpName', e.target.value.toUpperCase())} /></label>
          <label className="field">NIK (16 digit)
            <input className={!nik.ok && d.nik.length >= 16 ? 'input bad' : ocrFilled ? 'input ocr' : 'input'} inputMode="numeric" value={d.nik} onChange={(e) => set('nik', e.target.value.replace(/\s/g, ''))} />
            <span className={nik.ok ? 'okmsg' : 'hint'}>{nik.message}</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <label className="field">Tempat lahir<input className="input" value={d.birthPlace} onChange={(e) => set('birthPlace', e.target.value.toUpperCase())} /></label>
            <label className="field">Tanggal lahir<input className="input" placeholder="DD-MM-YYYY" value={d.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></label>
          </div>
          <label className="field">Alamat sesuai e-KTP<input className="input" value={d.ktpAddress} onChange={(e) => set('ktpAddress', e.target.value.toUpperCase())} /></label>
          <h2 className="h2" style={{ fontSize: 15, marginTop: 6 }}>Selfie pegang e-KTP</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {([['sun', 'Tempat terang'], ['noHat', 'Tanpa topi, masker, kacamata'], ['card', 'KTP di samping wajah']] as const).map(([ic, t]) => (
              <span key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 6px' }}>
                <Icon name={ic} size={22} color="var(--blue)" />{t}
              </span>
            ))}
          </div>
          <LiveSelfie done={!!up.SELFIE} onDone={() => setUp((u) => ({ ...u, SELFIE: true }))} />
        </div>
      )}

      {step === 2 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Data usaha</h1>
          <div style={{ display: 'flex', gap: 10 }} role="radiogroup" aria-label="Toko">
            {([[true, 'store', 'Punya toko', 'Warung, kios, toko tetap'], [false, 'home', 'Tidak punya toko', 'Jualan dari rumah / online']] as const).map(([v, ic, t, s]) => (
              <button key={t} type="button" role="radio" aria-checked={d.hasStore === v} className="choice" onClick={() => set('hasStore', v)}>
                <Icon name={ic} size={24} color={d.hasStore === v ? 'var(--blue)' : 'var(--muted)'} />
                <strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{s}</span>
              </button>
            ))}
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Di mana Anda berjualan?</legend>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, minHeight: 40 }}><input type="checkbox" checked={d.sellsOffline} onChange={(e) => set('sellsOffline', e.target.checked)} style={{ width: 20, height: 20 }} />Offline, di toko atau rumah</label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, minHeight: 40 }}><input type="checkbox" checked={d.sellsOnline} onChange={(e) => set('sellsOnline', e.target.checked)} style={{ width: 20, height: 20 }} />Online, marketplace atau medsos</label>
            {d.sellsOnline && <label className="field">Link toko online<input className="input" value={d.onlineLink} onChange={(e) => set('onlineLink', e.target.value)} placeholder="shopee.co.id/tokoanda atau Instagram" /></label>}
          </fieldset>
          <BusinessTypePicker value={d.businessType} onChange={(v) => set('businessType', v)} />
          <label className="field">Nama usaha
            <input className={!name.ok && d.businessName ? 'input bad' : 'input'} value={d.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Contoh: WARUNG MAKAN RINA" />
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span className={name.ok ? 'okmsg' : d.businessName ? 'err' : 'hint'}>{name.message}</span><span className="hint">{d.businessName.trim().length}/25</span></span>
          </label>

          <h2 className="h2" style={{ fontSize: 15, marginTop: 6 }}>Alamat toko</h2>
          <div role="radiogroup" aria-label="Alamat toko" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {([['gps', 'pin', 'Lokasi saya sekarang', 'Saya sedang di toko · alamat terisi otomatis', pickMyLocation], ['manual', 'store', 'Lokasi lain', 'Toko di tempat lain · isi alamat manual', pickOtherLocation]] as const).map(([v, ic, t, sub, fn]) => (
              <button key={v} type="button" role="radio" aria-checked={locMode === v} className="choice" onClick={fn} disabled={locBusy}>
                <Icon name={ic} size={24} color={locMode === v ? 'var(--blue)' : 'var(--muted)'} />
                <strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{sub}</span>
              </button>
            ))}
          </div>
          {locMsg && (
            <span className={`fade-in ${locBusy ? 'hint' : locMode === 'gps' && d.lat != null ? 'okmsg' : 'hint'}`} role="status" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {locBusy && <span className="spin" aria-hidden="true" />}{locMsg}
              {!locBusy && locMode === 'gps' && d.lat != null && <a href={`https://maps.google.com/?q=${d.lat},${d.lng}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>Lihat titik di peta</a>}
            </span>
          )}
          {locMode !== '' && (<>
          <RegionPicker
            value={{ province: d.province, city: d.city, kecamatan: d.kecamatan, kelurahan: d.kelurahan, postalCode: d.postalCode, villageCode: d.villageCode }}
            onChange={(v) => setD((x) => ({ ...x, ...v }))}
          />
          <label className="field">Nama jalan<input className="input" value={d.street} onChange={(e) => set('street', e.target.value)} placeholder="Jl. ..." /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <label className="field">No / Blok<input className="input" value={d.number} onChange={(e) => set('number', e.target.value)} /></label>
            <label className="field">RT<input className="input" inputMode="numeric" value={d.rt} onChange={(e) => set('rt', e.target.value)} /></label>
            <label className="field">RW<input className="input" inputMode="numeric" value={d.rw} onChange={(e) => set('rw', e.target.value)} /></label>
          </div>
          {locMode === 'gps' && !d.rt && <span className="hint">RT/RW tidak tercatat di peta, jadi isi sendiri.</span>}
          </>)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <Upload kind="STORE_FRONT" label="Foto depan toko" icon="store" done={!!up.STORE_FRONT} onDone={() => setUp((u) => ({ ...u, STORE_FRONT: true }))} />
            <Upload kind="PRODUCT" label="Foto produk di toko" icon="box" done={!!up.PRODUCT} onDone={() => setUp((u) => ({ ...u, PRODUCT: true }))} />
          </div>
          <p className="hint">Nama toko harus terlihat jelas di foto depan toko.</p>
          <label className="field">Omzet per tahun
            <select className="input" value={d.turnover} onChange={(e) => set('turnover', e.target.value)}>
              {TURNOVER.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><IconTile name="bank" /><h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Rekening pencairan</h1></div>
          <p className="hint">Uang dari pembayaran QRIS dicairkan ke rekening ini. Wajib diisi agar bank bisa menerbitkan QRIS.</p>
          {knownBanks.length > 0 && (
            <div role="radiogroup" aria-label="Rekening" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {knownBanks.map((b) => (
                <button key={b.fromId} type="button" role="radio" aria-checked={bankChoice === 'same:' + b.fromId} className="cat-row tap" onClick={() => setBankChoice('same:' + b.fromId)}>
                  <span className={`radio-dot${bankChoice === 'same:' + b.fromId ? ' on' : ''}`} aria-hidden="true" />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}><strong style={{ fontSize: 14.5 }}>Pakai rekening yang sama</strong><span className="hint">{b.label} · a.n. {b.holder}</span></span>
                  <IconTile name="bank" size={40} />
                </button>
              ))}
              <button type="button" role="radio" aria-checked={bankChoice === 'other'} className="cat-row tap" onClick={() => setBankChoice('other')}>
                <span className={`radio-dot${bankChoice === 'other' ? ' on' : ''}`} aria-hidden="true" />
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}><strong style={{ fontSize: 14.5 }}>Rekening lain</strong><span className="hint">Isi rekening berbeda untuk toko ini</span></span>
                <IconTile name="plus" tone="slate" size={40} />
              </button>
            </div>
          )}
          {bankChoice === 'other' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="field">Bank<select className="input" value={d.bankName} onChange={(e) => set('bankName', e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="field">Nomor rekening<input className="input" inputMode="numeric" value={d.accountNo} onChange={(e) => set('accountNo', e.target.value.replace(/[^\d ]/g, ''))} placeholder="Contoh: 1234567890" /></label>
              <label className="field">Nama pemilik rekening<input className="input ocr" value={d.accountHolder} onChange={(e) => set('accountHolder', e.target.value.toUpperCase())} /><span className="hint">Harus sama dengan nama di e-KTP.</span></label>
            </div>
          )}
          <span style={{ fontSize: 13, fontWeight: 600 }}>Kapan uang dicairkan?</span>
          {([['H1', 'clock', 'H+1 (disarankan)', 'MDR 0% di bawah Rp500.000, 0,3% mulai Rp500.000. Rp2.000 per pencairan.'], ['SAME_DAY', 'sun', 'Hari yang sama', 'MDR 0,7%, tanpa biaya pencairan.']] as const).map(([v, ic, t, s]) => (
            <button key={v} type="button" role="radio" aria-checked={d.settlement === v} className="choice" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} onClick={() => set('settlement', v)}>
              <Icon name={ic} size={24} color={d.settlement === v ? 'var(--blue)' : 'var(--muted)'} /><span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 14 }}>{t}</strong><span className="hint">{s}</span></span>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Konfirmasi data</h1>
          <div className="card" style={{ padding: '4px 16px', gap: 0 }}>
            {([
              ['Pemilik', `${d.ktpName} · NIK ${d.nik.slice(0, 4)}…${d.nik.slice(-4)}`, 1],
              ['Usaha', `${d.businessName.toUpperCase()} · ${d.businessType}`, 2],
              ['Toko', `${d.hasStore ? 'Punya toko' : 'Tidak punya toko'} · ${[d.sellsOffline && 'offline', d.sellsOnline && 'online'].filter(Boolean).join(' & ')}`, 2],
              ['Alamat', `${d.street} ${d.number}, ${d.kelurahan}, ${d.kecamatan}, ${d.city}, ${d.province}`, 2],
              ['Rekening', `${bankChoice.startsWith('same:') ? knownBanks.find((b) => 'same:' + b.fromId === bankChoice)?.label ?? '' : `${d.bankName} ${d.accountNo}`} · cair ${d.settlement === 'H1' ? 'H+1' : 'hari yang sama'}`, 3]
            ] as const).map(([label, value, s]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="hint">{label}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span></span>
                <button type="button" onClick={() => setStep(s)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 0, minHeight: 44, cursor: 'pointer' }}>Ubah</button>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 20, height: 20, margin: 0, flexShrink: 0 }} />
            <span>Data saya benar. Saya setuju data dipakai AIPOS dan bank mitra untuk pendaftaran merchant, sesuai <a href="/syarat-ketentuan" target="_blank" style={{ fontWeight: 700 }}>Syarat &amp; Ketentuan</a> dan <a href="/kebijakan-privasi" target="_blank" style={{ fontWeight: 700 }}>Kebijakan Privasi</a>.</span>
          </label>
        </div>
      )}

      {step === 5 && (
        <div className="screen-in" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, paddingTop: 24 }}>
          <div className="confetti" aria-hidden="true">
            {CONFETTI.map(([dx, c, delay], i) => <span key={i} style={{ background: c, animationDelay: `${delay}s`, ['--dx' as string]: `${dx}px` } as React.CSSProperties} />)}
          </div>
          <span className="pop" style={{ width: 84, height: 84, borderRadius: '50%', background: '#12b76a', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(18,183,106,.35)' }}>
            <Icon name="check" size={44} strokeWidth={3} />
          </span>
          <h1 className="rise rise-1" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Pendaftaran terkirim!</h1>
          <p className="hint rise rise-2" style={{ fontSize: 14 }}>Tim kami memeriksa data Anda. QRIS biasanya aktif dalam 1–2 hari kerja. Kabar terbaru dikirim ke email Anda.</p>
          {ticket && <div className="card rise rise-2" style={{ padding: '12px 16px', gap: 2, alignItems: 'center' }}><span className="hint">Nomor tiket</span><strong style={{ fontSize: 17, letterSpacing: .5 }}>{ticket}</strong></div>}
          <div className="card rise rise-3" style={{ textAlign: 'left', width: '100%', gap: 12 }}>
            <strong style={{ fontSize: 15 }}>Sambil menunggu</strong>
            <span style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}><IconTile name="clock" size={36} />Pantau status pendaftaran di Beranda</span>
            {product === 'SOUNDBOX' && <span style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}><IconTile name="speaker" tone="orange" size={36} />Urus Soundbox Anda</span>}
          </div>
          <a href="/app" className="btn btn-primary btn-block rise rise-4" style={{ gap: 6 }}>Masuk ke aplikasi <Icon name="chevron" size={18} /></a>
        </div>
      )}

      {error && <p className="err" role="alert">{error}</p>}
      {step < 5 && <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setError(''); setStep(step - 1); }}>Kembali</button>}
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={busy || (step === 4 && !agree)} onClick={next}>
          {busy ? 'Menyimpan…' : step === 0 ? 'Mulai' : step === 4 ? 'Kirim pendaftaran' : 'Lanjut'}
        </button>
      </div>}
    </main>
  );
}
