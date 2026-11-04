'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/Icon';

const TABS: Array<[string, string, IconName]> = [
  ['/app', 'Beranda', 'home'],
  ['/app/transaksi', 'Transaksi', 'list'],
  ['/app/qris', 'QRIS', 'qris'],
  ['/app/pencairan', 'Pencairan', 'creditCard'],
  ['/app/akun', 'Akun', 'user']
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Navigasi aplikasi">
      {TABS.map(([href, label, icon]) => {
        const on = href === '/app' ? path === '/app' : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`nav-item${href === '/app/qris' ? ' nav-qris' : ''}`} aria-current={on ? 'page' : undefined}>
            <span className="nav-icon"><Icon name={icon} size={href === '/app/qris' ? 26 : 22} strokeWidth={on ? 2.3 : 1.8} /></span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
