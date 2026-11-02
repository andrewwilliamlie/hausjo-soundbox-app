'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BUSINESS_TYPES, PROVINCES } from '@/lib/provinces';
import { checkBusinessName, checkNik } from '@/lib/rules';

type Data = {
  ktpName: string; nik: string; birthPlace: string; birthDate: string; gender: string; ktpAddress: string;
  ocrConfidence: number | null;
  hasStore: boolean; sellsOffline: boolean; sellsOnline: boolean; onlineLink: string;
  businessType: string; businessName: string;
  street: string; number: string; rt: string; rw: string; kelurahan: string; kecamatan: string; city: string; province: string; postalCode: string;
  lat: number | null; lng: number | null; turnover: string;
};

const OCR_KEYS = ['ktpName', 'nik', 'birthPlace', 'birthDate', 'ktpAddress'] as const;
const TURNOVER: Array<[string, string]> = [
  ['UMI', 'Di bawah Rp2 miliar/tahun (Usaha Mikro)'],
  ['UKE', 'Rp2–15 miliar/tahun (Usaha Kecil)'],
  ['UME', 'Rp15–50 miliar/tahun (Usaha Menengah)'],
  ['UBE', 'Di atas Rp50 miliar/tahun']
];

async function post(url: string, body?: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan, coba lagi');
  return json;
}

export function Upload({ kind, label, done, onDone }: { kind: string; label: string; done: boolean; onDone: (ocr?: { fields: Partial<Data>; confidence: number } | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('file', file);
    try {
      const res = await fetch('/api/app/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah');
      onDone(json.ocr);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className={done ? 'upload done' : 'upload'}>
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={pick} aria-label={label} />
        <span>{label}</span>
        <span style={{ fontSize: 11.5, fontWeight: 500 }}>{busy ? 'Mengunggah…' : done ? 'Terunggah ✓ · ketuk untuk ganti' : 'Ketuk untuk ambil foto'}</span>
      </label>
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export default function Steps({ initial, uploaded, product }: { initial: Data; uploaded: Record<string, boolean>; product: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 intro, 1 KTP, 2 usaha, 3 konfirmasi
  const [d, setD] = useState<Data>(initial);
  const [up, setUp] = useState<Record<string, boolean>>(uploaded);
  const [ocrFilled, setOcrFilled] = useState(initial.ocrConfidence != null);
  const [ocrEdited, setOcrEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);
  const [locMsg, setLocMsg] = useState(initial.lat != null ? 'Lokasi toko tersimpan' : '');

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
      return { ...rest, ...(lat != null && lng != null ? { lat, lng } : {}) };
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
      if (!name.ok) return 'Periksa nama usaha: ' + name.message;
      if (!d.street.trim() || !d.kelurahan.trim() || !d.kecamatan.trim() || !d.city.trim() || !d.province) return 'Lengkapi alamat toko';
      if (!up.STORE_FRONT || !up.PRODUCT) return 'Unggah foto depan toko dan foto produk';
      if (d.sellsOnline && !d.onlineLink.trim()) return 'Isi link toko online';
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
      if (step === 3) {
        await post('/api/app/submit');
        router.push('/app?baru=1');
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

  function locate() {
    if (!navigator.geolocation) return setLocMsg('Lokasi tidak tersedia di perangkat ini');
    setLocMsg('Mencari lokasi…');
    navigator.geolocation.getCurrentPosition(
      (p) => { setD((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })); setLocMsg('Lokasi toko tersimpan'); },
      () => setLocMsg('Izin lokasi ditolak. Isi alamat secara manual.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const labels = ['Foto e-KTP & selfie', 'Data usaha', 'Konfirmasi'];

  return (
    <main className="content">
      {step > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="hint" style={{ fontWeight: 600 }}>Langkah {step} dari 3 · {labels[step - 1]}</span>
          <div className="steps" aria-hidden="true">{labels.map((_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div>
        </div>
      )}

      {step === 0 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>3 langkah, sekitar 5 menit</h1>
          <p className="hint" style={{ fontSize: 13.5 }}>Lakukan di toko Anda dan siapkan e-KTP asli.</p>
          {[['1 · Foto e-KTP & selfie', 'Data KTP terbaca otomatis bila tersedia'], ['2 · Data usaha', 'Lokasi toko dan foto toko'], ['3 · Konfirmasi', 'Periksa, lalu kirim']].map(([t, s]) => (
            <div key={t} className="card" style={{ padding: 14, gap: 2 }}><strong style={{ fontSize: 15 }}>{t}</strong><span className="hint">{s}</span></div>
          ))}
          <div className="note">Setelah dikirim, Anda langsung masuk aplikasi. Tambah rekening{product === 'SOUNDBOX' ? ' dan urus Soundbox' : ''} dari sana sambil kami memeriksa data.</div>
        </div>
      )}

      {step === 1 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Foto e-KTP &amp; selfie</h1>
          <p className="hint">Foto di tempat terang, seluruh KTP terlihat, tidak buram.</p>
          <Upload kind="KTP" label="Foto e-KTP" done={!!up.KTP} onDone={(ocr) => {
            setUp((u) => ({ ...u, KTP: true }));
            if (ocr) { setD((x) => ({ ...x, ...ocr.fields })); setOcrFilled(true); setOcrEdited(false); }
          }} />
          {ocrFilled && <span className="okmsg">Terbaca otomatis. Periksa dan ubah jika ada yang salah.</span>}
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
          <p className="hint">Tempat terang · tanpa topi, masker atau kacamata · KTP di samping wajah.</p>
          <Upload kind="SELFIE" label="Selfie dengan e-KTP" done={!!up.SELFIE} onDone={() => setUp((u) => ({ ...u, SELFIE: true }))} />
        </div>
      )}

      {step === 2 && (
        <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Data usaha</h1>
          <div style={{ display: 'flex', gap: 10 }} role="radiogroup" aria-label="Toko">
            {([[true, 'Punya toko', 'Warung, kios, toko tetap'], [false, 'Tidak punya toko', 'Jualan dari rumah / online']] as const).map(([v, t, s]) => (
              <button key={t} type="button" role="radio" aria-checked={d.hasStore === v} className="choice" onClick={() => set('hasStore', v)}>
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
          <label className="field">Jenis usaha
            <input className="input" list="jenis-usaha" value={d.businessType} onChange={(e) => set('businessType', e.target.value)} placeholder="Cari: warung, laundry, pulsa…" />
            <datalist id="jenis-usaha">{BUSINESS_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
          </label>
          <label className="field">Nama usaha
            <input className={!name.ok && d.businessName ? 'input bad' : 'input'} value={d.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Contoh: WARUNG MAKAN RINA" />
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span className={name.ok ? 'okmsg' : d.businessName ? 'err' : 'hint'}>{name.message}</span><span className="hint">{d.businessName.trim().length}/25</span></span>
          </label>

          <h2 className="h2" style={{ fontSize: 15, marginTop: 6 }}>Alamat toko</h2>
          <button type="button" className="btn btn-ghost" onClick={locate}>Gunakan lokasi saya sekarang</button>
          {locMsg && <span className={d.lat != null ? 'okmsg' : 'hint'}>{locMsg}</span>}
          <label className="field">Provinsi
            <select className="input" value={d.province} onChange={(e) => set('province', e.target.value)}>
              <option value="">Pilih provinsi</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <label className="field">Kota / Kabupaten<input className="input" value={d.city} onChange={(e) => set('city', e.target.value)} /></label>
            <label className="field">Kecamatan<input className="input" value={d.kecamatan} onChange={(e) => set('kecamatan', e.target.value)} /></label>
            <label className="field">Kelurahan / Desa<input className="input" value={d.kelurahan} onChange={(e) => set('kelurahan', e.target.value)} /></label>
            <label className="field">Kode pos<input className="input" inputMode="numeric" value={d.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></label>
          </div>
          <label className="field">Nama jalan<input className="input" value={d.street} onChange={(e) => set('street', e.target.value)} placeholder="Jl. ..." /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <label className="field">No / Blok<input className="input" value={d.number} onChange={(e) => set('number', e.target.value)} /></label>
            <label className="field">RT<input className="input" inputMode="numeric" value={d.rt} onChange={(e) => set('rt', e.target.value)} /></label>
            <label className="field">RW<input className="input" inputMode="numeric" value={d.rw} onChange={(e) => set('rw', e.target.value)} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <Upload kind="STORE_FRONT" label="Foto depan toko" done={!!up.STORE_FRONT} onDone={() => setUp((u) => ({ ...u, STORE_FRONT: true }))} />
            <Upload kind="PRODUCT" label="Foto produk di toko" done={!!up.PRODUCT} onDone={() => setUp((u) => ({ ...u, PRODUCT: true }))} />
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Konfirmasi data</h1>
          <div className="card" style={{ padding: '4px 16px', gap: 0 }}>
            {([
              ['Pemilik', `${d.ktpName} · NIK ${d.nik.slice(0, 4)}…${d.nik.slice(-4)}`, 1],
              ['Usaha', `${d.businessName.toUpperCase()} · ${d.businessType}`, 2],
              ['Toko', `${d.hasStore ? 'Punya toko' : 'Tidak punya toko'} · ${[d.sellsOffline && 'offline', d.sellsOnline && 'online'].filter(Boolean).join(' & ')}`, 2],
              ['Alamat', `${d.street} ${d.number}, ${d.kelurahan}, ${d.kecamatan}, ${d.city}, ${d.province}`, 2]
            ] as const).map(([label, value, s]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="hint">{label}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span></span>
                <button type="button" onClick={() => setStep(s)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 0, minHeight: 44, cursor: 'pointer' }}>Ubah</button>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 20, height: 20, margin: 0, flexShrink: 0 }} />
            <span>Data saya benar. Saya setuju data dipakai HausJo dan bank mitra untuk pendaftaran merchant.</span>
          </label>
        </div>
      )}

      {error && <p className="err" role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setError(''); setStep(step - 1); }}>Kembali</button>}
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={busy || (step === 3 && !agree)} onClick={next}>
          {busy ? 'Menyimpan…' : step === 0 ? 'Mulai' : step === 3 ? 'Kirim pendaftaran' : 'Lanjut'}
        </button>
      </div>
    </main>
  );
}
