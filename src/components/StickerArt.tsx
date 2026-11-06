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

/** Compact countertop/handheld terminal with a small screen and keypad (A620). */
export function EdcSmallThumb({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="13" y="3" width="22" height="42" rx="5" fill="#0b2253" />
      <rect x="16" y="7" width="16" height="13" rx="2" fill="#cfe0ff" />
      <Pattern x={19.5} y={8.5} size={9} color="#0069fc" />
      <g fill="#8db4ff">
        {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={16.5 + c * 5.5} y={24 + r * 5} width="4" height="3.2" rx="1" />))}
      </g>
      <rect x="16.5" y="39" width="4" height="3" rx="1" fill="#f04438" /><rect x="22" y="39" width="4" height="3" rx="1" fill="#fdb022" /><rect x="27.5" y="39" width="4" height="3" rx="1" fill="#12b76a" />
    </svg>
  );
}

/** Larger touch-screen terminal with a receipt printer on top (A920 Pro). */
export function EdcLargeThumb({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M16 2h16v5H16z" fill="#fff" stroke="#8db4ff" strokeWidth="1.2" />
      <rect x="10" y="5" width="28" height="41" rx="5" fill="#0b2253" />
      <rect x="13" y="9" width="22" height="30" rx="2.5" fill="#e9f1ff" />
      <rect x="13" y="9" width="22" height="6" rx="2.5" fill="#0069fc" />
      <Pattern x={17} y={18} size={14} color="#0b2253" />
      <rect x="20" y="41.5" width="8" height="2" rx="1" fill="#8db4ff" />
    </svg>
  );
}

export function ProductThumb({ code, size = 48 }: { code: string; size?: number }) {
  if (code === 'A620') return <EdcSmallThumb size={size} />;
  if (code === 'A920PRO') return <EdcLargeThumb size={size} />;
  if (code === 'AKRILIK') return <AcrylicThumb size={size} />;
  if (code === 'SOUNDBOX') return <SoundboxThumb size={size} />;
  return <StickerThumb size={size} />;
}

/** Top banner for "Beli EDC": two terminals on a blue counter. */
export function EdcHero() {
  return (
    <svg viewBox="0 0 360 170" width="100%" style={{ display: 'block' }} role="img" aria-label="Mesin EDC">
      <defs>
        <linearGradient id="edc-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0a2a6e" /><stop offset="1" stopColor="#0069fc" /></linearGradient>
      </defs>
      <rect width="360" height="170" fill="url(#edc-bg)" />
      <circle cx="310" cy="20" r="70" fill="#fff" opacity=".07" />
      <circle cx="30" cy="170" r="70" fill="#fff" opacity=".06" />
      <rect y="140" width="360" height="30" fill="#061a45" opacity=".45" />
      <g transform="translate(100 14) rotate(-6)">
        <path d="M30 0h40v12H30z" fill="#fff" />
        <rect y="8" width="100" height="132" rx="14" fill="#0b2253" stroke="#3a8bff" strokeWidth="2" />
        <rect x="9" y="20" width="82" height="96" rx="7" fill="#e9f1ff" />
        <rect x="9" y="20" width="82" height="18" rx="7" fill="#0069fc" />
        <rect x="9" y="31" width="82" height="7" fill="#0069fc" />
        <text x="50" y="33" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="inherit">Rp150.000</text>
        <Pattern x={27} y={48} size={46} />
        <rect x="38" y="124" width="24" height="5" rx="2.5" fill="#3a8bff" />
      </g>
      <g transform="translate(222 46) rotate(7)">
        <rect width="60" height="104" rx="10" fill="#0b2253" stroke="#3a8bff" strokeWidth="2" />
        <rect x="7" y="9" width="46" height="34" rx="4" fill="#cfe0ff" />
        <Pattern x={17} y={12} size={26} color="#0069fc" />
        <g fill="#8db4ff">
          {[0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={9 + c * 15} y={50 + r * 12} width="12" height="8" rx="2" />))}
        </g>
      </g>
      <g fill="#fff">
        <path d="M58 46l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" opacity=".9" />
        <path d="M322 116l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".7" />
      </g>
    </svg>
  );
}

/** Small speaker box with a QR on the front and sound waves (Soundbox). */
export function SoundboxThumb({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="7" y="8" width="26" height="34" rx="7" fill="#fff" stroke="#0b2253" strokeWidth="2" />
      <Pattern x={12} y={13} size={16} />
      <text x="20" y="38" textAnchor="middle" fontSize="5" fontWeight="800" fill="#0b2253" fontFamily="inherit">AIPOS</text>
      <path d="M37 18a8 8 0 0 1 0 12M41 14a14 14 0 0 1 0 20" fill="none" stroke="#0069fc" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Top banner for "Beli Soundbox": the speaker announcing a payment. */
export function SoundboxHero() {
  return (
    <svg viewBox="0 0 360 170" width="100%" style={{ display: 'block' }} role="img" aria-label="Soundbox QRIS">
      <defs>
        <linearGradient id="sbx-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0069fc" /><stop offset="1" stopColor="#0a2a6e" /></linearGradient>
      </defs>
      <rect width="360" height="170" fill="url(#sbx-bg)" />
      <circle cx="40" cy="20" r="70" fill="#fff" opacity=".07" />
      <rect y="142" width="360" height="28" fill="#061a45" opacity=".4" />
      <g transform="translate(108 22)">
        <rect width="86" height="122" rx="22" fill="#fff" />
        <Pattern x={18} y={18} size={50} />
        <text x="43" y="98" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0b2253" fontFamily="inherit">AIPOS</text>
        <rect x="30" y="106" width="26" height="4" rx="2" fill="#cfe0ff" />
      </g>
      <g fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="5" opacity=".85">
        <path d="M212 66a24 24 0 0 1 0 40" /><path d="M226 52a44 44 0 0 1 0 68" opacity=".6" />
      </g>
      <g transform="translate(236 28)">
        <rect width="112" height="34" rx="12" fill="#fff" />
        <text x="56" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4a5878" fontFamily="inherit">Pembayaran diterima</text>
        <text x="56" y="27" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#067647" fontFamily="inherit">Rp25.000</text>
      </g>
    </svg>
  );
}

/** Banner for a shop kind. */
export function ShopHero({ kind }: { kind: 'STIKER' | 'EDC' | 'SOUNDBOX' }) {
  return kind === 'EDC' ? <EdcHero /> : kind === 'SOUNDBOX' ? <SoundboxHero /> : <StickerHero />;
}
