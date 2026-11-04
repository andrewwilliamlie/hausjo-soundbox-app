import { requireAdmin, ROLE_LABEL } from '@/lib/auth';
import AdminHeader from '../AdminHeader';
import ChangePassword from './ChangePassword';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Akun saya · Admin AIPOS' };

export default async function AccountPage() {
  const admin = await requireAdmin(undefined, { allowMustChange: true });
  return (
    <div className="admin">
      <AdminHeader admin={admin} tab="akun" />
      <div className="admin-wrap" style={{ maxWidth: 520 }}>
        {admin.mustChangePassword && (
          <div className="note">Anda masuk dengan kata sandi sementara. Buat kata sandi baru dulu untuk membuka menu admin.</div>
        )}
        <section className="card" style={{ gap: 4 }}>
          <strong style={{ fontSize: 16 }}>{admin.name}</strong>
          <span className="hint">{admin.email} · {ROLE_LABEL[admin.role]}</span>
        </section>
        <ChangePassword forced={admin.mustChangePassword} />
      </div>
    </div>
  );
}
