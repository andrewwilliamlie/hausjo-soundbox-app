import { redirect } from 'next/navigation';
import { merchantId } from '@/lib/auth';
import Intro from './Intro';

export const metadata = { title: 'AIPOS · Terima pembayaran, lebih tenang' };
export const dynamic = 'force-dynamic';

// Start page: splash logo, then the intro slides ending in Daftar / Masuk. Logged-in merchants go straight to the app.
export default async function Start() {
  if (await merchantId()) redirect('/app');
  return <Intro />;
}
