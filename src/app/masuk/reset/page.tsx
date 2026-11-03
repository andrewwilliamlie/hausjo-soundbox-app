import Link from 'next/link';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/passwords';
import ResetForm from './ResetForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kata sandi baru · HausJo', robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = '' } = await searchParams;
  const row = t ? await db.passwordReset.findUnique({ where: { tokenHash: hashToken(t) }, include: { user: true } }) : null;
  const valid = !!row && !row.usedAt && row.expiresAt > new Date();
  return (
    <div className="shell">
      <header className="topbar"><Link href="/" className="brand">HAUS<span>JO</span></Link></header>
      {valid ? (
        <ResetForm token={t} who={row!.user.phone.slice(0, 4) + '••••' + row!.user.phone.slice(-3)} />
      ) : (
        <div className="content screen-in">
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Link tidak berlaku</h1>
          <p className="hint" style={{ fontSize: 14 }}>Link ini sudah kedaluwarsa atau sudah dipakai. Minta link baru, lalu buka link terbaru di email.</p>
          <Link href="/masuk/lupa" className="btn btn-primary btn-block">Minta link baru</Link>
        </div>
      )}
    </div>
  );
}
