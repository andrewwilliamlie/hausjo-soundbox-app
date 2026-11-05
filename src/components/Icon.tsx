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
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  creditCard: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3 5.5" /></>,
  printer: <><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="7" rx="1" /></>,
  edc: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M9 6h6v4H9zM9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3.5 7 8 12 8zM12 8s1.5-5 4-4.5S17 8 12 8z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  dollar: <><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5v1.5M12 16v1.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
  sort: <path d="M4 7h16M7 12h10M10 17h4" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  food: <><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M7 21h10M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3" /></>,
  cart: <><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>,
  car: <><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM5 11h14" /><circle cx="7.5" cy="13.5" r=".5" /><circle cx="16.5" cy="13.5" r=".5" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  shirt: <path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z" />,
  scissors: <><circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="M8.5 8.5L20 19M8.5 15.5L20 5" /></>,
  pill: <><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" /><path d="M9.5 9.5l5 5" /></>,
  washer: <><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="13" r="5" /><path d="M8 6h.01M11 6h.01M9.5 14a3 3 0 0 0 5 0" /></>,
  hammer: <><path d="M14 4l6 6-3 3-6-6zM11 7l-8 8 3 3 8-8" /></>,
  leaf: <><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19l8-8" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>
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
export type Tone = 'blue' | 'orange' | 'green' | 'navy' | 'pink' | 'purple' | 'teal' | 'yellow' | 'red' | 'slate';
export function IconTile({ name, tone = 'blue', size = 44 }: { name: IconName; tone?: Tone; size?: number }) {
  const tones: Record<Tone, [string, string]> = {
    blue: ['#e8f1ff', '#0069fc'], orange: ['#fff1e3', '#c4500a'], green: ['#e7f8ef', '#067647'], navy: ['#16336f', '#ffffff'],
    pink: ['#fdebf3', '#c11574'], purple: ['#f1ecff', '#6927da'], teal: ['#e3f7f6', '#0e7c78'], yellow: ['#fff8db', '#9a6b00'],
    red: ['#feeceb', '#c0281b'], slate: ['#eef1f6', '#475467']
  };
  const [bg, fg] = tones[tone];
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: 12, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={name} color={fg} size={Math.round(size * 0.5)} />
    </span>
  );
}
