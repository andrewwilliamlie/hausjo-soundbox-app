import { NewOrder } from '../../stiker/views';

export const metadata = { title: 'Kertas struk · AIPOS' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <NewOrder kind="KERTAS" />;
}
