import { NextResponse } from 'next/server';
import { z } from 'zod';
import { merchantId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Reverse geocoding for "Gunakan lokasi saya sekarang": GPS point → address parts (Google Geocoding API, Indonesian names).
// Uses GEOCODE_API_KEY, or the OCR Google key when that key also allows the Geocoding API.
// RT/RW are not in any map data, so the merchant always types those.

type Comp = { long_name: string; short_name: string; types: string[] };
type GeoResult = { address_components: Comp[]; formatted_address: string };

const body = z.object({ lat: z.number().min(-12).max(7), lng: z.number().min(94).max(142) });

export async function POST(req: Request) {
  if (!(await merchantId())) return NextResponse.json({ error: 'Silakan masuk lagi' }, { status: 401 });
  const p = body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: 'Lokasi di luar Indonesia' }, { status: 400 });
  const key = process.env.GEOCODE_API_KEY || process.env.OCR_API_KEY;
  if (!key) return NextResponse.json({ error: 'Pengisian alamat otomatis belum aktif' }, { status: 503 });

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${p.data.lat},${p.data.lng}&language=id&region=id&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const json = (await res.json()) as { status: string; error_message?: string; results?: GeoResult[] };
    if (json.status !== 'OK' || !json.results?.length) {
      console.error('[geo] reverse geocode', json.status, json.error_message ?? '');
      return NextResponse.json({ error: 'Alamat tidak ditemukan untuk lokasi ini' }, { status: 502 });
    }
    // The first result is the most precise; later ones fill in parts it lacks.
    const pick = (type: string) => {
      for (const r of json.results!) {
        const c = r.address_components.find((x) => x.types.includes(type));
        if (c) return c.long_name;
      }
      return '';
    };
    return NextResponse.json({
      province: pick('administrative_area_level_1'),
      city: pick('administrative_area_level_2'),
      district: pick('administrative_area_level_3'),
      village: pick('administrative_area_level_4') || pick('sublocality_level_1') || pick('locality'),
      postalCode: pick('postal_code'),
      street: pick('route'),
      number: pick('street_number'),
      formatted: json.results[0].formatted_address
    });
  } catch (e) {
    console.error('[geo] failed', e);
    return NextResponse.json({ error: 'Gagal membaca alamat. Coba lagi atau isi manual.' }, { status: 502 });
  }
}
