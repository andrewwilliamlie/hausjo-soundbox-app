import Link from 'next/link';
import Icon from '@/components/Icon';
import { CS_WHATSAPP_DISPLAY } from '@/lib/contact';
import { loadMerchantView } from '@/lib/merchant-view';
import { logout } from '../../masuk/actions';
import PageTop from '../PageTop';
import PasswordForm from './PasswordForm';

export const metadata = { title: 'Akun · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const app = await loadMerchantView();
  const row = (label: string, value: string) => (
    <div className="fee"><span>{label}</span><strong style={{ textAlign: 'right' }}>{value || '–'}</strong></div>
  );
  return (
    <>
      <PageTop title="Akun" />
      <main className="app-sheet inner">
        <section className="card rise" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <span className="avatar">{app.ownerFirstName.slice(0, 1)}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong style={{ fontSize: 16 }}>{app.ownerName || app.ownerFirstName}</strong>
            <span className="hint">{app.phone} · {app.email}</span>
          </span>
        </section>

        <section id="toko" className="card rise rise-1" style={{ gap: 2, scrollMarginTop: 16 }}>
          <strong style={{ fontSize: 15, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="store" size={18} />Toko saya</strong>
          {row('Nama usaha', app.businessName)}
          {row('Produk', app.product === 'SOUNDBOX' ? 'Soundbox QRIS' : 'QRIS saja')}
          {row('Alamat', app.address)}
          {row('NMID', app.nmid ?? 'Belum terbit')}
          {row('Tiket pendaftaran', app.ticket)}
          {app.trackingNo && row('Pengiriman Soundbox', `${app.courier ?? ''} ${app.trackingNo}`)}
          <span className="hint" style={{ marginTop: 6 }}>Data toko diubah lewat CS agar tetap sama dengan data di bank.</span>
        </section>

        <PasswordForm />

        <nav className="card rise rise-2 menu-list" aria-label="Lainnya">
          <Link href="/app/bantuan"><Icon name="help" size={20} />Bantuan · panduan &amp; CS {CS_WHATSAPP_DISPLAY}<Icon name="chevron" size={18} /></Link>
          <a href="https://hausjo.id/produk" target="_blank" rel="noreferrer"><Icon name="edc" size={20} />Beli EDC<Icon name="chevron" size={18} /></a>
          <Link href="/syarat-ketentuan"><Icon name="file" size={20} />Syarat &amp; Ketentuan<Icon name="chevron" size={18} /></Link>
          <Link href="/kebijakan-privasi"><Icon name="shield" size={20} />Kebijakan Privasi<Icon name="chevron" size={18} /></Link>
        </nav>

        <form action={logout}>
          <button className="btn btn-ghost btn-block" style={{ color: 'var(--err)', gap: 8 }}><Icon name="logout" size={18} />Keluar</button>
        </form>
      </main>
    </>
  );
}
