import { cookies } from 'next/headers';
import WelcomeLogin from './LoginForm';

export const metadata = { title: 'Masuk · AIPOS' };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ form?: string }> }) {
  const last = (await cookies()).get('hj_last')?.value ?? '';
  const { form } = await searchParams;
  const title = last ? last.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  return <WelcomeLogin storeName={title} openForm={form === '1'} />;
}
