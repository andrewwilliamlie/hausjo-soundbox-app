import Link from 'next/link';
import ForgotForm from './ForgotForm';

export const metadata = { title: 'Lupa kata sandi · HausJo' };

export default function ForgotPage() {
  return (
    <div className="shell">
      <header className="topbar"><Link href="/" className="brand">HAUS<span>JO</span></Link></header>
      <ForgotForm />
    </div>
  );
}
