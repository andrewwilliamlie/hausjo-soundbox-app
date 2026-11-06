import { OrdersList } from '../stiker/views';

export const metadata = { title: 'Beli EDC · AIPOS' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <OrdersList kind="EDC" />;
}
