import { requireMerchant } from '@/lib/auth';
import { db } from '@/lib/db';
import PageTop from '../PageTop';
import OutletsClient, { type Outlet } from './OutletsClient';

export const metadata = { title: 'Toko saya · AIPOS' };
export const dynamic = 'force-dynamic';

const STATUS: Record<string, [string, string, string]> = {
  DRAFT: ['Belum selesai daftar', '#fff4e5', '#b54708'],
  SUBMITTED: ['Sedang diperiksa', '#e8f1ff', '#0058d6'],
  REVISION: ['Perlu revisi', '#fff4e5', '#b54708'],
  BANK: ['Diproses bank', '#f1edff', '#4a2ba8'],
  ACTIVE: ['QRIS aktif', '#ecfdf3', '#067647'],
  REJECTED: ['Ditolak', '#fef3f2', '#b42318']
};

export default async function OutletsPage({ searchParams }: { searchParams: Promise<{ penuh?: string }> }) {
  const { user, application } = await requireMerchant();
  const { penuh } = await searchParams;
  const apps = await db.application.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  const outlets: Outlet[] = apps.map((a, i) => {
    const [label, bg, fg] = STATUS[a.status] ?? [a.status, '#eef1f6', '#344054'];
    return {
      id: a.id,
      name: a.businessName || `Toko ${i + 1} (belum diberi nama)`,
      area: [a.kelurahan, a.kecamatan, (a.city ?? '').replace(/^(Kota|Kabupaten)( Administrasi)? /i, '')].filter(Boolean).join(', '),
      product: a.product === 'SOUNDBOX' ? 'Soundbox QRIS' : 'QRIS saja',
      nmid: a.nmid, status: label, bg, fg, current: a.id === application?.id
    };
  });
  return (
    <>
      <PageTop title="Toko saya" sub={`${outlets.length} toko`} />
      <OutletsClient outlets={outlets} full={penuh === '1'} />
    </>
  );
}
