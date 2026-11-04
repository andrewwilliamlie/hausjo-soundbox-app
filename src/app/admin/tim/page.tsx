import { requireAdmin, ROLE_LABEL, type Role } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminHeader from '../AdminHeader';
import { AddMember, MemberRow } from './TeamForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tim · Admin AIPOS' };

const ROLE_HELP: Array<[Role, string]> = [
  ['REVIEWER', 'Memeriksa foto dan data, minta revisi, pilih bank, menyetujui pendaftaran.'],
  ['ACTIVATION', 'Mengisi MPAN/MID/NMID, unggah stiker QRIS, mengaktifkan, mencatat pengiriman Soundbox.'],
  ['ADMIN', 'Semua akses, termasuk mengelola tim dan mengunduh cadangan data.']
];

export default async function TeamPage() {
  const admin = await requireAdmin(['ADMIN']);
  const members = await db.admin.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] });
  const fmt = (d: Date | null) => (d ? d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) : 'Belum pernah');
  return (
    <div className="admin">
      <AdminHeader admin={admin} tab="tim" />
      <div className="admin-wrap" style={{ maxWidth: 1100 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Tim admin</h1>
          <p className="hint" style={{ marginTop: 4 }}>Setiap orang punya akun sendiri, jadi setiap tindakan tercatat atas namanya.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <section className="card" style={{ flex: '999 1 560px', minWidth: 0, padding: 0, gap: 0, overflow: 'hidden' }} aria-label="Anggota tim">
            {members.map((m) => (
              <MemberRow key={m.id} self={m.id === admin.id}
                m={{ id: m.id, name: m.name, email: m.email, role: m.role, active: m.active, pending: m.mustChangePassword, lastLogin: fmt(m.lastLoginAt) }} />
            ))}
          </section>
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AddMember />
            <section className="card" style={{ gap: 10 }}>
              <strong style={{ fontSize: 14 }}>Peran</strong>
              {ROLE_HELP.map(([r, t]) => <span key={r} style={{ fontSize: 13, lineHeight: 1.5 }}><strong>{ROLE_LABEL[r]}:</strong> {t}</span>)}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
