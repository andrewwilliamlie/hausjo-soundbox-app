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

/* ---------- Matching a reverse-geocoded address to the Kemendagri lists ---------- */

const nkey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const stripProv = (s: string) => s.replace(/^\s*(provinsi|daerah khusus ibukota|daerah khusus|daerah istimewa|dki|di)\s+/i, '');
const cityType = (s: string) => (/^\s*kota\b/i.test(s) ? 'kota' : /^\s*(kabupaten|kab\.?)\b/i.test(s) ? 'kab' : '');
const stripCity = (s: string) => s.replace(/^\s*(kota administrasi|kabupaten administrasi|kota|kabupaten|kab\.?)\s+/i, '');
const stripDist = (s: string) => s.replace(/^\s*(kecamatan|kec\.?)\s+/i, '');
const stripVill = (s: string) => s.replace(/^\s*(kelurahan|kel\.?|desa)\s+/i, '');

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Best name match: exact, then one name containing the other, then up to 2 typos. */
function best<T extends [string, string, ...unknown[]]>(list: T[] | undefined, wanted: string, strip: (s: string) => string, prefer?: (x: T) => boolean): T | undefined {
  const w = nkey(strip(wanted));
  if (!list || !w) return undefined;
  const scored = list
    .map((x) => {
      const n = nkey(strip(x[1]));
      const score = n === w ? 0 : n.length >= 4 && w.length >= 4 && (n.includes(w) || w.includes(n)) ? 1 : w.length >= 5 && lev(n, w) <= 2 ? 2 : 9;
      return { x, score: score + (prefer && !prefer(x) ? 0.5 : 0) };
    })
    .filter((s) => s.score < 9)
    .sort((a, b) => a.score - b.score);
  return scored[0]?.x;
}

export type GeoAddress = { province: string; city: string; district: string; village: string; postalCode: string };

/** Turns Google's address parts into names from our region lists; returns as many levels as could be matched. */
export async function matchRegion(g: GeoAddress): Promise<{ region: Region; levels: number }> {
  const empty: Region = { province: '', city: '', kecamatan: '', kelurahan: '', postalCode: g.postalCode || '', villageCode: '' };
  const index = await loadIndex();
  const prov = best(index, g.province, stripProv);
  if (!prov) return { region: empty, levels: 0 };
  const t = cityType(g.city);
  const city = best(prov[2], g.city, stripCity, t ? (x) => cityType(x[1]) === t : undefined);
  if (!city) return { region: { ...empty, province: prov[1] }, levels: 1 };
  const file = await loadCity(city[0]);
  let dist = best(file, g.district, stripDist);
  let vill = dist ? best(dist[2], g.village, stripVill) : undefined;
  if (!vill && g.village) {
    // Google sometimes skips or misnames the kecamatan; look for the kelurahan anywhere in the city.
    for (const d of file) {
      const v = best(d[2], g.village, stripVill);
      if (v && (!dist || d === dist || !best(dist[2], g.village, stripVill))) { dist = d; vill = v; break; }
    }
  }
  const region: Region = {
    province: prov[1],
    city: city[1],
    kecamatan: dist?.[1] ?? '',
    kelurahan: vill?.[1] ?? '',
    villageCode: vill?.[0] ?? '',
    postalCode: (/^\d{5}$/.test(g.postalCode) ? g.postalCode : '') || vill?.[2] || ''
  };
  return { region, levels: 2 + (dist ? 1 : 0) + (vill ? 1 : 0) };
}
