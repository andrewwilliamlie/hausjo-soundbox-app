/** AIPOS wordmark (from the brand file), blue for light backgrounds and white for blue ones, with optional "by HausJo". */
export default function Logo({ white = false, height = 24, tagline = false }: { white?: boolean; height?: number; tagline?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
      <img src={white ? '/brand/aipos-white.png' : '/brand/aipos-blue.png'} alt="AIPOS" height={height} style={{ height, width: 'auto', display: 'block' }} />
      {tagline && <span style={{ fontSize: Math.max(10, Math.round(height * 0.26)), fontWeight: 800, fontStyle: 'italic', letterSpacing: .3, marginTop: 3, color: white ? '#dbe8ff' : 'var(--blue)' }}>by HausJo</span>}
    </span>
  );
}
