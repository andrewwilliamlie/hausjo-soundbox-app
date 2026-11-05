// Drawings for the sticker order screens: a generic QR pattern on a sticker and on an acrylic stand.

const QR_CELLS = [
  '1110111', '1010101', '1110111', '0001000', '1101011', '0110110', '1011101'
];

/** A made-up QR-like pattern (not scannable), drawn inside a size×size box at x,y. */
function Pattern({ x, y, size, color = '#0b2253' }: { x: number; y: number; size: number; color?: string }) {
  const c = size / 7;
  return (
    <g fill={color}>
      {QR_CELLS.flatMap((row, r) => [...row].map((v, k) => (v === '1' ? <rect key={`${r}-${k}`} x={x + k * c} y={y + r * c} width={c * 0.92} height={c * 0.92} rx={c * 0.18} /> : null)))}
    </g>
  );
}

export function StickerThumb({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="4" width="36" height="40" rx="5" fill="#fff" stroke="#0069fc" strokeWidth="2" />
      <rect x="6" y="4" width="36" height="9" rx="5" fill="#0069fc" />
      <rect x="6" y="9" width="36" height="4" fill="#0069fc" />
      <text x="24" y="11.5" textAnchor="middle" fontSize="6" fontWeight="800" fill="#fff" fontFamily="inherit">QRIS</text>
      <Pattern x={13} y={17} size={22} />
      <path d="M42 34v5a5 5 0 0 1-5 5h-5z" fill="#cfe0ff" />
    </svg>
  );
}

export function AcrylicThumb({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 4h28l-2 34H12z" fill="#e9f1ff" stroke="#8db4ff" strokeWidth="1.5" />
      <rect x="14" y="8" width="20" height="24" rx="2.5" fill="#fff" stroke="#0069fc" strokeWidth="1.5" />
      <rect x="14" y="8" width="20" height="5" rx="2.5" fill="#0069fc" />
      <Pattern x={17.5} y={15.5} size={13} />
      <path d="M6 38h36v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="#0b2253" />
      <path d="M14 5l-1.6 26" stroke="#fff" strokeWidth="1.2" opacity=".8" />
    </svg>
  );
}

/** Top banner for "Pesan stiker": a stand and a sticker on a blue counter. */
export function StickerHero() {
  return (
    <svg viewBox="0 0 360 170" width="100%" style={{ display: 'block' }} role="img" aria-label="Stiker QRIS dan stand akrilik">
      <defs>
        <linearGradient id="stk-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0069fc" /><stop offset="1" stopColor="#3a8bff" /></linearGradient>
      </defs>
      <rect width="360" height="170" fill="url(#stk-bg)" />
      <circle cx="300" cy="30" r="60" fill="#fff" opacity=".08" />
      <circle cx="40" cy="160" r="70" fill="#fff" opacity=".07" />
      <rect y="132" width="360" height="38" fill="#0a2a6e" opacity=".35" />
      {/* acrylic stand */}
      <g transform="translate(118 18)">
        <path d="M6 0h96l-7 116H13z" fill="#fff" opacity=".28" />
        <rect x="18" y="10" width="72" height="92" rx="7" fill="#fff" />
        <rect x="18" y="10" width="72" height="18" rx="7" fill="#0b2253" />
        <rect x="18" y="21" width="72" height="7" fill="#0b2253" />
        <text x="54" y="23.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="inherit">QRIS</text>
        <Pattern x={30} y={38} size={48} />
        <text x="54" y="97" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4a5878" fontFamily="inherit">NAMA TOKO ANDA</text>
        <path d="M-6 116h120v8a4 4 0 0 1-4 4H-2a4 4 0 0 1-4-4z" fill="#0b2253" />
        <path d="M12 3l-6 100" stroke="#fff" strokeWidth="3" opacity=".5" />
      </g>
      {/* loose sticker */}
      <g transform="translate(250 64) rotate(10)">
        <rect width="58" height="66" rx="7" fill="#fff" />
        <rect width="58" height="14" rx="7" fill="#0069fc" />
        <rect y="8" width="58" height="6" fill="#0069fc" />
        <text x="29" y="11" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" fontFamily="inherit">QRIS</text>
        <Pattern x={12} y={22} size={34} />
        <path d="M58 52v7a7 7 0 0 1-7 7h-7z" fill="#cfe0ff" />
      </g>
      {/* sparkles */}
      <g fill="#fff">
        <path d="M60 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" opacity=".9" />
        <path d="M86 90l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".7" />
        <path d="M322 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".7" />
      </g>
    </svg>
  );
}
