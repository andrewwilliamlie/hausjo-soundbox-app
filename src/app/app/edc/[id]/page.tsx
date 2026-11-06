import { OrderDetail } from '../../stiker/views';

export const metadata = { title: 'Pesanan EDC · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string }> }) {
  const [{ id }, { baru }] = await Promise.all([params, searchParams]);
  return <OrderDetail kind="EDC" id={id} baru={baru} />;
}
