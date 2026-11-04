import Logo from '@/components/Logo';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { merchantId } from '@/lib/auth';
import DaftarForm from './DaftarForm';

export const metadata = { title: 'Daftar merchant · AIPOS' };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ produk?: string }> }) {
  if (await merchantId()) redirect('/daftar/langkah');
  const { produk } = await searchParams;
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" aria-label="AIPOS beranda"><Logo height={26} /></Link>
        <span className="hint" style={{ fontWeight: 600 }}>Daftar</span>
      </header>
      <DaftarForm initialProduct={produk === 'qris' ? 'qris' : 'soundbox'} />
    </div>
  );
}
