import { OrdersList } from '../stiker/views';

export const metadata = { title: 'Beli Soundbox · AIPOS' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <OrdersList kind="SOUNDBOX" />;
}
