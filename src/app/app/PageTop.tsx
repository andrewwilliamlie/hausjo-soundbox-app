import Link from 'next/link';
import Icon from '@/components/Icon';

/** Blue header for inner merchant screens: back arrow, title, optional right-side action. */
export default function PageTop({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-top">
      <div className="page-top-row">
        <Link href="/app" aria-label="Kembali ke beranda" className="back"><Icon name="arrowLeft" size={22} /></Link>
        <h1>{title}</h1>
        <span style={{ marginLeft: 'auto' }}>{action}</span>
      </div>
      {children}
    </div>
  );
}
