import Logo from '@/components/Logo';
import Link from 'next/link';
import ForgotForm from './ForgotForm';

export const metadata = { title: 'Lupa kata sandi · AIPOS' };

export default function ForgotPage() {
  return (
    <div className="shell">
      <header className="topbar"><Link href="/" aria-label="AIPOS beranda"><Logo height={26} /></Link></header>
      <ForgotForm />
    </div>
  );
}
