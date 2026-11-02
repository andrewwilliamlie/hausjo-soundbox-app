// One consistent line-icon set (24px grid, 2px stroke, round caps), decorative by default.
const PATHS: Record<string, React.ReactNode> = {
  qris: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M20 20h.01M17 20h3v-3" /></>,
  speaker: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  ktp: <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2.5" /><path d="M13 10h5M13 14h3" /></>,
  selfie: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  store: <><path d="M3 9l1.5-5h15L21 9M3 9h18v11H3zM9 20v-6h6v6" /></>,
  home: <><path d="M3 11l9-7 9 7M5 10v10h14V10" /></>,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></>,
  pin: <><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  bank: <><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></>,
  noHat: <><circle cx="12" cy="9" r="4" /><path d="M5 21a7 7 0 0 1 14 0M4 4l16 16" /></>,
  card: <><rect x="3" y="7" width="12" height="8" rx="1" /><circle cx="18" cy="8" r="3" /></>,
  wallet: <><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 7l12-4v4M17 13h.01" /></>,
  scan: <path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M17 8v8" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  whatsapp: <><path d="M4 20l1.4-4A8 8 0 1 1 8 18.6z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z" /></>,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 22, color = 'currentColor', label, strokeWidth = 2, className }: {
  name: IconName; size?: number; color?: string; label?: string; strokeWidth?: number; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {PATHS[name]}
    </svg>
  );
}

/** Rounded tinted square holding an icon. */
export function IconTile({ name, tone = 'blue', size = 44 }: { name: IconName; tone?: 'blue' | 'orange' | 'green' | 'navy'; size?: number }) {
  const tones = { blue: ['#eaf2ff', '#1f5fd6'], orange: ['#fff4e5', '#b54708'], green: ['#ecfdf3', '#067647'], navy: ['#16336f', '#ffffff'] };
  const [bg, fg] = tones[tone];
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: 12, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={name} color={fg} size={Math.round(size * 0.5)} />
    </span>
  );
}
