// Turns OCR words (text + position + confidence) from a photo of an Indonesian e-KTP into fields.
// Provider-independent: any OCR that gives word boxes can feed this. No imports so it can be unit-tested with plain Node.

export type OcrWord = { text: string; x: number; y: number; w: number; h: number; conf: number };
export type ParsedKtp = {
  fields: {
    ktpName?: string; nik?: string; birthPlace?: string; birthDate?: string; gender?: string;
    religion?: string; occupation?: string; ktpAddress?: string;
  };
  confidence: number; // 0–100
};

type Line = { text: string; words: OcrWord[] };

/** Groups words into reading lines by vertical overlap, then left to right. */
export function toLines(words: OcrWord[]): Line[] {
  const sorted = [...words].filter((w) => w.text.trim()).sort((a, b) => a.y + a.h / 2 - (b.y + b.h / 2));
  const lines: Array<{ cy: number; h: number; words: OcrWord[] }> = [];
  for (const w of sorted) {
    const cy = w.y + w.h / 2;
    const line = lines.find((l) => Math.abs(l.cy - cy) < Math.min(l.h, w.h) * 0.55);
    if (line) {
      line.words.push(w);
      line.cy = line.words.reduce((s, x) => s + x.y + x.h / 2, 0) / line.words.length;
    } else lines.push({ cy, h: w.h, words: [w] });
  }
  return lines
    .sort((a, b) => a.cy - b.cy)
    .map((l) => {
      const ws = l.words.sort((a, b) => a.x - b.x);
      return { words: ws, text: ws.map((w) => w.text).join(' ').replace(/\s+([:,.])/g, '$1').replace(/\s+/g, ' ').trim() };
    });
}

// Labels as printed on the card; OCR often confuses I/1/l and O/0, so they are matched loosely.
const LABELS: Array<[key: string, re: RegExp]> = [
  ['nik', /^N\s*[I1l|]\s*K\b/i],
  ['nama', /^NAMA\b/i],
  ['lahir', /^TEMPAT\s*\/?\s*TGL\.?(\s*LAHIR)?|^TEMPAT\b|^TGL\.?\s*LAHIR/i],
  ['kelamin', /^JENIS\s*KELAMIN|^JENIS\s*KEL/i],
  ['alamat', /^ALAMAT\b/i],
  ['rtrw', /^RT\s*\/\s*RW|^RT\s*RW|^RTIRW|^RT\/AW/i],
  ['kel', /^KEL\s*\/?\s*DESA|^KEL\b|^DESA\b/i],
  ['kec', /^KECAMATAN\b|^KEC\b/i],
  ['agama', /^AGAMA\b/i],
  ['kawin', /^STATUS\s*PERKAWINAN|^STATUS\b/i],
  ['kerja', /^PEKERJAAN\b/i],
  ['wn', /^KEWARGANEGARAAN\b/i],
  ['berlaku', /^BERLAKU\b/i],
  ['gol', /^GOL\.?\s*DARAH/i]
];

function labelOf(text: string): [string, string] | null {
  for (const [key, re] of LABELS) {
    const m = text.match(re);
    if (m) {
      // Value is whatever follows the label text and its colon.
      let rest = text.slice(m[0].length).replace(/^[^:]*?:/, (s) => (s.length < 25 ? '' : s));
      rest = rest.replace(/^[\s:;.\-]+/, '').trim();
      return [key, rest];
    }
  }
  return null;
}

const DIGIT_FIX: Record<string, string> = { O: '0', o: '0', D: '0', Q: '0', I: '1', l: '1', '|': '1', i: '1', L: '1', Z: '2', z: '2', S: '5', s: '5', B: '8', G: '6', b: '6', T: '7', '?': '7', A: '4' };

const fixDigits = (t: string) => t.replace(/[OoDQIl|iLZzSsBGbT?A]/g, (c) => DIGIT_FIX[c] ?? c);

/** 16-digit NIK from the text after the NIK label (letters that look like digits are fixed). */
export function findNik(text: string): string | undefined {
  return fixDigits(text).replace(/[\s.\-]/g, '').match(/\d{16}/)?.[0];
}

/** Fallback when the label was not read: a mostly-numeric token (or adjacent tokens) of 16 digits. */
function findNikLoose(lines: Line[]): string | undefined {
  for (const l of lines) {
    const toks = l.words.map((w) => w.text).filter((t) => (t.match(/\d/g)?.length ?? 0) / t.length >= 0.6);
    const m = fixDigits(toks.join('')).match(/\d{16}/);
    if (m) return m[0];
  }
  return undefined;
}

function cleanName(s: string) {
  return s.replace(/[^A-Za-z.,'\s-]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function parseBirth(v: string): { birthPlace?: string; birthDate?: string } {
  const d = v.replace(/[Oo]/g, '0').match(/(\d{1,2})\s*[-./ ]\s*(\d{1,2})\s*[-./ ]\s*(\d{4})/);
  const birthDate = d ? `${d[1].padStart(2, '0')}-${d[2].padStart(2, '0')}-${d[3]}` : undefined;
  const place = (d ? v.slice(0, d.index) : v.split(',')[0]).replace(/[,\d]/g, ' ').replace(/[^A-Za-z.\s-]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  return { birthPlace: place || undefined, birthDate };
}

function parseGender(v: string) {
  const u = v.toUpperCase();
  if (/PEREM/.test(u)) return 'PEREMPUAN';
  if (/LAKI/.test(u)) return 'LAKI-LAKI';
  return undefined;
}

const RELIGIONS = ['ISLAM', 'KRISTEN', 'KATOLIK', 'KATHOLIK', 'HINDU', 'BUDDHA', 'BUDHA', 'KONGHUCU', 'KHONGHUCU', 'KEPERCAYAAN'];

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/^[:;.\s-]+|[:;\s-]+$/g, '').trim().toUpperCase();

export function parseKtp(words: OcrWord[]): ParsedKtp | null {
  const full = toLines(words);
  if (!full.length) return null;
  const all = full.map((l) => l.text).join('\n');

  // The right side of the card holds the photo, with the issue city/date under it. On the right half, a wide gap
  // after a value means the rest of the line belongs to that column, so it is left out of the value.
  const minX = Math.min(...words.map((w) => w.x));
  const maxX = Math.max(...words.map((w) => w.x + w.w));
  const half = minX + 0.55 * (maxX - minX);
  const lines: Line[] = full.map((l) => {
    const ws: OcrWord[] = [];
    for (const w of l.words) {
      const prev = ws[ws.length - 1];
      if (prev && w.x > half && w.x - (prev.x + prev.w) > 3 * Math.max(w.h, prev.h)) break;
      ws.push(w);
    }
    return { words: ws, text: ws.map((w) => w.text).join(' ').replace(/\s+([:,.])/g, '$1').replace(/\s+/g, ' ').trim() };
  });

  const found: Record<string, { value: string; idx: number }> = {};
  lines.forEach((l, idx) => {
    const lab = labelOf(l.text);
    if (lab && !(lab[0] in found)) found[lab[0]] = { value: lab[1], idx };
  });

  // Header lines: PROVINSI ..., KOTA/KABUPATEN ...
  const city = full.find((l) => /^(KOTA|KABUPATEN)\b/i.test(l.text))?.text;

  const fields: ParsedKtp['fields'] = {};
  fields.nik = findNik(found.nik?.value ?? '') ?? findNikLoose(lines);
  const name = cleanName(found.nama?.value ?? '');
  if (name.length >= 2) fields.ktpName = name;
  if (found.lahir) Object.assign(fields, parseBirth(found.lahir.value));
  fields.gender = parseGender(found.kelamin?.value ?? '') ?? parseGender(all.match(/LAKI|PEREMPUAN/i)?.[0] ?? '');
  const rel = clean(found.agama?.value ?? '');
  fields.religion = RELIGIONS.find((r) => rel.includes(r)) ?? (rel || undefined);
  const job = clean(found.kerja?.value ?? '');
  if (job) fields.occupation = job;

  // Address: the ALAMAT value plus unlabeled wrapped lines below it, then RT/RW, Kel/Desa, Kecamatan, city.
  if (found.alamat) {
    const parts = [clean(found.alamat.value)];
    for (let i = found.alamat.idx + 1; i < lines.length && i < found.alamat.idx + 3; i++) {
      if (labelOf(lines[i].text)) break;
      parts.push(clean(lines[i].text));
    }
    const street = parts.filter(Boolean).join(' ')
      // Hamlet numbers are Roman numerals ("DUSUN I", "DUSUN III"); OCR often reads the I as T, 1 or l.
      .replace(/\bDUSUN\s*([IVXT1l|]{1,4})\b/g, (_m, r: string) => 'DUSUN ' + r.replace(/[T1l|]/g, 'I'));
    const rtrw = (found.rtrw?.value ?? '').replace(/[Oo]/g, '0').match(/(\d{1,3})\s*[/\\|1l]?\s*(\d{1,3})/);
    const segs = [
      street,
      rtrw ? `RT ${rtrw[1].padStart(3, '0')}/RW ${rtrw[2].padStart(3, '0')}` : '',
      found.kel?.value ? 'KEL. ' + clean(found.kel.value) : '',
      found.kec?.value ? 'KEC. ' + clean(found.kec.value) : '',
      city ? clean(city) : ''
    ].filter(Boolean);
    if (street) fields.ktpAddress = segs.join(', ').slice(0, 200);
  }

  for (const k of Object.keys(fields) as Array<keyof ParsedKtp['fields']>) if (!fields[k]) delete fields[k];
  if (!fields.nik && !fields.ktpName) return null; // probably not a KTP photo

  // Confidence: average word confidence on the lines we used, lowered when key fields are missing.
  const used = Object.values(found).flatMap((f) => lines[f.idx].words);
  const avg = used.length ? used.reduce((s, w) => s + w.conf, 0) / used.length : 0.5;
  let confidence = Math.round(avg * 100);
  if (!fields.nik || !fields.ktpName) confidence = Math.min(confidence, 60);
  if (!fields.birthDate || !fields.ktpAddress) confidence = Math.min(confidence, 80);
  return { fields, confidence };
}
