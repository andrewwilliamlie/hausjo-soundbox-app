import Logo from '@/components/Logo';
import Link from 'next/link';
import type { Admin } from '@prisma/client';
import { adminLogout } from './actions';

const TABS: Array<[string, string, string, boolean]> = [
  ['antrean', 'Antrean', '/admin', false],
  ['stiker', 'Pesanan stiker', '/admin/stiker', false],
  ['tim', 'Tim', '/admin/tim', true],
  ['cadangan', 'Cadangan', '/admin/cadangan', true],
  ['akun', 'Akun saya', '/admin/akun', false]
];

/** Navy top bar shared by every admin page. Team and backup tabs are shown to the ADMIN role only. */
export default function AdminHeader({ admin, tab }: { admin: Admin; tab: string }) {
  return (
    <header className="admin-top">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Logo white height={20} /><span style={{ fontWeight: 500, fontSize: 13, color: '#bfd4ff' }}>Admin</span></strong>
        {!admin.mustChangePassword && (
          <nav aria-label="Menu admin" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.filter(([k, , , adminOnly]) => (!adminOnly || admin.role === 'ADMIN') && (k !== 'stiker' || admin.role !== 'REVIEWER')).map(([k, label, href]) => (
              <Link key={k} href={href} aria-current={tab === k ? 'page' : undefined}
                style={{ color: '#fff', textDecoration: 'none', fontSize: 13.5, fontWeight: 600, padding: '8px 12px', borderRadius: 8, background: tab === k ? 'rgba(255,255,255,.14)' : 'transparent' }}>
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
      <form action={adminLogout} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: '#dce6fa' }}>{admin.name}</span>
        <button style={{ background: 'none', border: '1px solid #8db4ff', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Keluar</button>
      </form>
    </header>
  );
}
