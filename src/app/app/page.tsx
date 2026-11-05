import { requireMerchant } from '@/lib/auth';
import { loadMerchantView } from '@/lib/merchant-view';
import HomeClient from './HomeClient';

export const metadata = { title: 'Beranda · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function AppHome({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  const app = await loadMerchantView();
  const { baru } = await searchParams;
  const { outletCount } = await requireMerchant();
  return <HomeClient app={app} isNew={baru === '1'} outletCount={outletCount} />;
}
