import { OrdersList } from '../stiker/views';

export const metadata = { title: 'Kertas struk · AIPOS' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <OrdersList kind="KERTAS" />;
}
