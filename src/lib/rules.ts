// Shared validation rules (used by forms in the browser and again on the server).

const BRANDS = ['BRILINK', 'BRI', 'MANDIRI', 'BNI', 'BCA', 'GOPAY', 'DANA', 'OVO', 'NOBU', 'BUKALAPAK', 'TELKOM'];

export type Check = { ok: boolean; message: string };

/** Business name rules from the banks: max 25 characters, letters/digits/spaces, no other brands. */
export function checkBusinessName(raw: string): Check {
  const name = raw.trim();
  if (!name) return { ok: false, message: 'Wajib diisi' };
  if (name.length > 25) return { ok: false, message: 'Maksimal 25 karakter. Singkat nama usaha Anda.' };
  if (/[^A-Za-z0-9 ]/.test(name)) return { ok: false, message: 'Hanya huruf, angka dan spasi (tanpa @ - . & dll).' };
  if (name.toUpperCase().split(/\s+/).some((w) => BRANDS.includes(w)))
    return { ok: false, message: 'Tidak boleh memakai nama bank atau merek lain.' };
  return { ok: true, message: 'Tercetak di QRIS: ' + name.toUpperCase() };
}

export function checkNik(nik: string): Check {
  if (!/^\d*$/.test(nik)) return { ok: false, message: 'NIK hanya berisi angka' };
  if (nik.length !== 16) return { ok: false, message: `${nik.length} dari 16 digit` };
  return { ok: true, message: 'Sudah benar: 16 digit' };
}

const EMAIL_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com'
};

/** Returns a corrected email when the domain looks like a common typo, else null. */
export function suggestEmail(email: string): string | null {
  const [user, domain] = email.trim().split('@');
  if (!user || !domain) return null;
  const fix = EMAIL_TYPOS[domain.toLowerCase()];
  return fix ? `${user}@${fix}` : null;
}

/** Indonesian mobile numbers: normalise to 08xxxxxxxxxx. */
export function normalisePhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('62')) d = '0' + d.slice(2);
  if (d.startsWith('8')) d = '0' + d;
  return d;
}

export function isValidPhone(raw: string): boolean {
  return /^08\d{8,12}$/.test(normalisePhone(raw));
}

/** MDR label used in the QRIS sheet "MDR HAUSJO (%)" column. */
export function mdrLabel(settlement: 'H1' | 'SAME_DAY'): string {
  return settlement === 'H1' ? '0% (< Rp500.000) / 0,3% (>= Rp500.000), H+1, Rp2.000/pencairan' : '0,7%, hari yang sama';
}

/** 6-digit PIN rules: digits only, and not an easy-to-guess pattern. */
export function checkPin(pin: string): Check {
  if (!/^\d*$/.test(pin)) return { ok: false, message: 'PIN hanya berisi angka' };
  if (pin.length !== 6) return { ok: false, message: `${pin.length} dari 6 angka` };
  const d = pin.split('').map(Number);
  const same = d.every((x) => x === d[0]);
  const up = d.every((x, i) => i === 0 || x === (d[i - 1] + 1) % 10);
  const down = d.every((x, i) => i === 0 || x === (d[i - 1] + 9) % 10);
  const repeat = pin.slice(0, 3) === pin.slice(3) || pin.slice(0, 2).repeat(3) === pin;
  if (same || up || down || repeat || pin === '112233') return { ok: false, message: 'PIN terlalu mudah ditebak. Hindari angka berurutan atau berulang.' };
  return { ok: true, message: 'PIN aman' };
}
