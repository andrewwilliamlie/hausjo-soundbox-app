import Link from 'next/link';
import Icon from '@/components/Icon';

/** Blue header for inner merchant screens: back arrow, title, optional right-side action. */
export default function PageTop({ title, sub, back = '/app', action, children }: { title: string; sub?: string; back?: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-top">
      <div className="page-top-row">
        <Link href={back} aria-label="Kembali" className="back"><Icon name="arrowLeft" size={22} /></Link>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h1>{title}</h1>
          {sub && <span style={{ fontSize: 12.5, color: '#dbe8ff' }}>{sub}</span>}
        </span>
        <span style={{ marginLeft: 'auto' }}>{action}</span>
      </div>
      {children}
    </div>
  );
}
