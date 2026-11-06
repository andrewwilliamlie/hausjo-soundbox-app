import { OrderDetail } from '../views';

export const metadata = { title: 'Pesanan stiker · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string }> }) {
  const [{ id }, { baru }] = await Promise.all([params, searchParams]);
  return <OrderDetail kind="STIKER" id={id} baru={baru} />;
}
