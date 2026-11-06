import { OrderDetail } from '../../stiker/views';

export const metadata = { title: 'Pesanan kertas struk · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string }> }) {
  const [{ id }, { baru }] = await Promise.all([params, searchParams]);
  return <OrderDetail kind="KERTAS" id={id} baru={baru} />;
}
