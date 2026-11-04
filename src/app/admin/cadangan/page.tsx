import { requireAdmin } from '@/lib/auth';
import { listBackups } from '@/lib/backup';
import AdminHeader from '../AdminHeader';
import BackupNow from './BackupNow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cadangan · Admin AIPOS' };

const size = (b: number) => (b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

export default async function BackupPage() {
  const admin = await requireAdmin(['ADMIN']);
  const files = await listBackups().catch(() => []);
  return (
    <div className="admin">
      <AdminHeader admin={admin} tab="cadangan" />
      <div className="admin-wrap" style={{ maxWidth: 900 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Cadangan data</h1>
          <p className="hint" style={{ marginTop: 4 }}>Database dicadangkan otomatis setiap hari sekitar pukul 02.00 WIB. 14 cadangan terakhir disimpan di server.</p>
        </div>

        <section className="card" style={{ gap: 12 }}>
          <strong style={{ fontSize: 15 }}>Simpan salinan di luar server, seminggu sekali</strong>
          <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>Cadangan di server melindungi dari data yang terhapus tidak sengaja, tetapi tidak bila server rusak. Unduh cadangan database terbaru dan arsip foto, lalu simpan di Google Drive perusahaan dalam folder yang aksesnya terbatas. Isinya data pribadi merchant (NIK, foto e-KTP).</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {files[0] && <a className="btn btn-ghost" href={`/api/admin/backup/${files[0].name}`}>Unduh database terbaru ({size(files[0].size)})</a>}
            <a className="btn btn-ghost" href="/api/admin/backup/foto">Unduh semua foto (.tar.gz)</a>
          </div>
          <BackupNow />
        </section>

        <section className="card" style={{ padding: 0, gap: 0, overflow: 'hidden' }} aria-label="Daftar cadangan">
          <div className="hint" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>{files.length} cadangan database · terbaru di atas</div>
          {files.length === 0 && <p className="hint" style={{ padding: 16 }}>Belum ada cadangan. Yang pertama dibuat otomatis beberapa menit setelah server menyala, atau tekan "Buat cadangan sekarang".</p>}
          {files.map((f) => (
            <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong>{f.at.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB</strong>
                <span className="hint">{f.name} · {size(f.size)}</span>
              </span>
              <a href={`/api/admin/backup/${f.name}`} style={{ fontWeight: 700, fontSize: 13 }}>Unduh</a>
            </div>
          ))}
        </section>

        <section className="card" style={{ gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Memulihkan data</strong>
          <span className="hint">Pemulihan menimpa data yang ada. Lakukan bersama developer; langkahnya ada di README repositori, bagian "Cadangan & pemulihan".</span>
        </section>
      </div>
    </div>
  );
}
