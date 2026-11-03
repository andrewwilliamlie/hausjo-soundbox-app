// KTP OCR. Set OCR_PROVIDER=google and OCR_API_KEY (a Google Cloud API key restricted to the Cloud Vision API).
// With no provider, or on any error/timeout, this returns null and the merchant types the fields by hand.
// Adding another provider (e.g. Verihubs, VIDA) only needs an adapter that returns OcrResult.

import { parseKtp, type OcrWord } from './ktp-parse';

export type KtpFields = {
  ktpName?: string;
  nik?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  religion?: string;
  occupation?: string;
  ktpAddress?: string;
};

export type OcrResult = { fields: KtpFields; confidence: number } | null;

const VISION_MAX_BYTES = 7 * 1024 * 1024; // base64 must stay under Vision's 10 MB request limit

type Vertex = { x?: number; y?: number };
type VisionWord = { confidence?: number; boundingBox?: { vertices?: Vertex[] }; symbols?: Array<{ text?: string }> };
type VisionResponse = {
  responses?: Array<{
    error?: { message?: string };
    fullTextAnnotation?: { pages?: Array<{ blocks?: Array<{ paragraphs?: Array<{ words?: VisionWord[] }> }> }> };
  }>;
};

async function google(image: Buffer): Promise<OcrResult> {
  const key = process.env.OCR_API_KEY;
  if (!key) {
    console.warn('[ocr] OCR_PROVIDER=google but OCR_API_KEY is empty');
    return null;
  }
  if (image.length > VISION_MAX_BYTES) return null;
  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ image: { content: image.toString('base64') }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }], imageContext: { languageHints: ['id'] } }]
    }),
    signal: AbortSignal.timeout(15_000)
  });
  const json = (await res.json().catch(() => ({}))) as VisionResponse & { error?: { message?: string } };
  const r = json.responses?.[0];
  if (!res.ok || json.error || r?.error) {
    console.error('[ocr] Google Vision error', res.status, json.error?.message ?? r?.error?.message);
    return null;
  }
  const raw: Array<{ text: string; v: Vertex[]; conf: number }> = [];
  for (const page of r?.fullTextAnnotation?.pages ?? [])
    for (const block of page.blocks ?? [])
      for (const para of block.paragraphs ?? [])
        for (const w of para.words ?? []) {
          const v = w.boundingBox?.vertices ?? [];
          if (v.length === 4) raw.push({ text: (w.symbols ?? []).map((s) => s.text ?? '').join(''), v, conf: w.confidence ?? 0.5 });
        }
  // Vision lists each word's corners in reading order, so vertex 0 → 1 is the text direction. Rotate everything so text
  // runs left to right; this straightens tilted photos and KTPs shot sideways.
  const angles = raw.map((w) => Math.atan2((w.v[1].y ?? 0) - (w.v[0].y ?? 0), (w.v[1].x ?? 0) - (w.v[0].x ?? 0))).sort((a, b) => a - b);
  const angle = angles.length ? angles[Math.floor(angles.length / 2)] : 0;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const words: OcrWord[] = raw.map((w) => {
    const pts = w.v.map((p) => ({ x: (p.x ?? 0) * cos - (p.y ?? 0) * sin, y: (p.x ?? 0) * sin + (p.y ?? 0) * cos }));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { text: w.text, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, conf: w.conf };
  });
  return parseKtp(words);
}

export async function readKtp(image: Buffer, _mime: string): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER;
  if (!provider) return null;
  try {
    if (provider === 'google') return await google(image);
    console.warn(`[ocr] unknown OCR_PROVIDER "${provider}"`);
  } catch (e) {
    console.error('[ocr] failed', e);
  }
  return null;
}
