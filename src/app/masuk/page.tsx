import Link from 'next/link';
import LoginForm from './LoginForm';

export const metadata = { title: 'Masuk · HausJo' };

export default function MasukPage() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">HAUS<span>JO</span></Link>
      </header>
      <LoginForm />
    </div>
  );
}
