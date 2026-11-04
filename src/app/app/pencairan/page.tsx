import { loadMerchantView } from '@/lib/merchant-view';
import PageTop from '../PageTop';
import PayoutClient from './PayoutClient';

export const metadata = { title: 'Pencairan · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function PayoutPage() {
  const app = await loadMerchantView();
  return (
    <>
      <PageTop title="Pencairan" />
      <PayoutClient app={app} />
    </>
  );
}
