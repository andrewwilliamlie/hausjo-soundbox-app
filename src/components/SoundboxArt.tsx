// Animated Soundbox illustration: the device, sound waves and a payment bubble that pops in.
export default function SoundboxArt({ compact = false }: { compact?: boolean }) {
  const h = compact ? 120 : 170;
  return (
    <div aria-hidden="true" className="sb-art" style={{ height: h }}>
      <div className="sb-device" style={{ width: compact ? 58 : 78, height: compact ? 80 : 108 }}>
        <svg width={compact ? 30 : 40} height={compact ? 30 : 40} viewBox="0 0 24 24" fill="none" stroke="#0b2253" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3z" />
        </svg>
        <span style={{ fontSize: compact ? 8 : 9.5, fontWeight: 800, letterSpacing: 0.5, color: '#0b2253' }}>HAUSJO</span>
      </div>
      <div className="wave"><i /><i /><i /><i /><i /></div>
      {!compact && <div className="sb-bubble">“Pembayaran diterima, Rp25.000”</div>}
    </div>
  );
}
