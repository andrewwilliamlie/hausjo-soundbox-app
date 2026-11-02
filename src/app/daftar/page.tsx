import Link from 'next/link';
import { redirect } from 'next/navigation';
import { merchantId } from '@/lib/session';
import DaftarForm from './DaftarForm';

export const metadata = { title: 'Daftar merchant · HausJo' };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ produk?: string }> }) {
  if (await merchantId()) redirect('/daftar/langkah');
  const { produk } = await searchParams;
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">HAUS<span>JO</span></Link>
        <span className="hint" style={{ fontWeight: 600 }}>Daftar</span>
      </header>
      <DaftarForm initialProduct={produk === 'qris' ? 'qris' : 'soundbox'} />
    </div>
  );
}
