import { NewOrder } from '../views';

export const metadata = { title: 'Pesan stiker · AIPOS' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <NewOrder kind="STIKER" />;
}
