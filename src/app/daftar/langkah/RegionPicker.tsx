'use client';

import { useEffect, useMemo, useState } from 'react';

// Data: /public/wilayah, built from Kepmendagri 2025 codes (see scripts/build-wilayah.py).
type Index = Array<[string, string, Array<[string, string]>]>; // province → cities
type CityFile = Array<[string, string, Array<[string, string, string]>]>; // district → villages [code, name, postal]

export type Region = { province: string; city: string; kecamatan: string; kelurahan: string; postalCode: string; villageCode: string };

let indexCache: Promise<Index> | null = null;
const cityCache = new Map<string, Promise<CityFile>>();

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error('load failed');
  return r.json();
}
const loadIndex = () => (indexCache ??= getJson<Index>('/wilayah/index.json').catch((e) => { indexCache = null; throw e; }));
function loadCity(code: string) {
  if (!cityCache.has(code)) cityCache.set(code, getJson<CityFile>(`/wilayah/${code}.json`).catch((e) => { cityCache.delete(code); throw e; }));
  return cityCache.get(code)!;
}

// Older entries used short province names.
const ALIAS: Record<string, string> = { 'dki jakarta': 'daerah khusus ibukota jakarta', 'di yogyakarta': 'daerah istimewa yogyakarta' };
const norm = (s: string) => { const n = s.trim().toLowerCase().replace(/\s+/g, ' '); return ALIAS[n] ?? n; };
const findByName = <T extends [string, string, ...unknown[]]>(list: T[] | undefined, name: string) =>
  name ? list?.find((x) => norm(x[1]) === norm(name)) : undefined;

/** Province → Kota/Kabupaten → Kecamatan → Kelurahan/Desa dropdowns that fill the postal code. Stores names (and the village code). */
export default function RegionPicker({ value, onChange }: { value: Region; onChange: (v: Partial<Region>) => void }) {
  const [index, setIndex] = useState<Index | null>(null);
  const [cityFile, setCityFile] = useState<CityFile | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    loadIndex().then(setIndex, () => setError('Daftar wilayah gagal dimuat. Periksa koneksi lalu coba lagi.'));
  }, [retry]);

  const prov = findByName(index ?? undefined, value.province);
  const cities = prov?.[2];
  const city = findByName(cities, value.city);
  const cityCode = city?.[0];

  useEffect(() => {
    setCityFile(null);
    if (!cityCode) return;
    let live = true;
    setCityLoading(true);
    loadCity(cityCode)
      .then((f) => { if (live) setCityFile(f); }, () => { if (live) setError('Daftar kecamatan gagal dimuat. Coba lagi.'); })
      .finally(() => { if (live) setCityLoading(false); });
    return () => { live = false; };
  }, [cityCode, retry]);

  const district = findByName(cityFile ?? undefined, value.kecamatan);
  const villages = district?.[2];
  const village = useMemo(
    () => (value.villageCode ? villages?.find((v) => v[0] === value.villageCode) : undefined) ?? findByName(villages, value.kelurahan),
    [villages, value.villageCode, value.kelurahan]
  );

  const clear = { kecamatan: '', kelurahan: '', postalCode: '', villageCode: '' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="field">Provinsi
        <select className="input" value={prov?.[0] ?? ''} disabled={!index}
          onChange={(e) => { const p = index?.find((x) => x[0] === e.target.value); onChange({ province: p?.[1] ?? '', city: '', ...clear }); }}>
          <option value="">{index ? 'Pilih provinsi' : 'Memuat…'}</option>
          {index?.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </label>
      <label className="field">Kota / Kabupaten
        <select className="input" value={cityCode ?? ''} disabled={!cities}
          onChange={(e) => { const c = cities?.find((x) => x[0] === e.target.value); onChange({ city: c?.[1] ?? '', ...clear }); }}>
          <option value="">{prov ? 'Pilih kota / kabupaten' : 'Pilih provinsi dulu'}</option>
          {cities?.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </label>
      <label className="field">Kecamatan
        <select className="input" value={district?.[0] ?? ''} disabled={!cityFile}
          onChange={(e) => { const d = cityFile?.find((x) => x[0] === e.target.value); onChange({ kecamatan: d?.[1] ?? '', kelurahan: '', postalCode: '', villageCode: '' }); }}>
          <option value="">{cityLoading ? 'Memuat…' : city ? 'Pilih kecamatan' : 'Pilih kota / kabupaten dulu'}</option>
          {cityFile?.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 10 }}>
        <label className="field">Kelurahan / Desa
          <select className="input" value={village?.[0] ?? ''} disabled={!villages}
            onChange={(e) => { const v = villages?.find((x) => x[0] === e.target.value); onChange({ kelurahan: v?.[1] ?? '', villageCode: v?.[0] ?? '', postalCode: v?.[2] ?? '' }); }}>
            <option value="">{district ? 'Pilih' : 'Pilih kecamatan dulu'}</option>
            {villages?.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </label>
        <label className="field">Kode pos
          <input className={village ? 'input ocr' : 'input'} inputMode="numeric" maxLength={5} value={value.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value.replace(/\D/g, '') })} />
        </label>
      </div>
      {village && <span className="hint fade-in">Kode pos terisi otomatis. Ubah bila kode pos toko Anda berbeda.</span>}
      {error && (
        <span className="err" role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {error}
          <button type="button" className="chip" onClick={() => { setError(''); setRetry((n) => n + 1); }}>Coba lagi</button>
        </span>
      )}
    </div>
  );
}
