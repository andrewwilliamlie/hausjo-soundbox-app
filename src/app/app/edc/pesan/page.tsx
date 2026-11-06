import { NewOrder } from '../../stiker/views';

export const metadata = { title: 'Beli EDC · AIPOS' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <NewOrder kind="EDC" />;
}
