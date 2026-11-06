import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { HELP_STATUS_LABEL, categoryById, topicById, type HelpStatus } from '@/lib/help';
import AdminHeader from '../AdminHeader';
import { updateHelpRequest } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bantuan · Admin AIPOS' };

const FILTERS: Array<[string, string]> = [['OPEN', 'Menunggu ditelepon'], ['CALLED', 'Sudah dihubungi'], ['DONE', 'Selesai'], ['all', 'Semua']];
const when = (d: Date) => d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });

export default async function HelpAdmin({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const admin = await requireAdmin();
  const { f = 'OPEN' } = await searchParams;
  const list = await db.helpRequest.findMany({ where: f === 'all' ? {} : { status: f }, orderBy: { createdAt: f === 'OPEN' ? 'asc' : 'desc' }, take: 200, include: { user: { select: { email: true } } } });
  const stores = new Map((await db.application.findMany({
    where: { id: { in: list.map((r) => r.applicationId).filter((x): x is string => !!x) } },
    select: { id: true, businessName: true, ticket: true, nmid: true }
  })).map((s) => [s.id, s]));
  const counts = await db.helpRequest.groupBy({ by: ['status'], _count: true });
  const count = (k: string) => (k === 'all' ? counts.reduce((s, c) => s + c._count, 0) : counts.find((c) => c.status === k)?._count ?? 0);

  return (
    <div className="admin">
      <AdminHeader admin={admin} tab="bantuan" />
      <div className="admin-wrap" style={{ maxWidth: 1000 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Permintaan telepon (Bantuan)</h1>
          <p className="hint" style={{ marginTop: 4 }}>Merchant yang sudah mencoba panduan di aplikasi tapi masalahnya belum teratasi. Yang terlama di atas. Telepon, lalu tandai "Sudah dihubungi" atau "Selesai".</p>
        </div>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} aria-label="Filter status">
          {FILTERS.map(([k, label]) => (
            <Link key={k} href={`/admin/bantuan?f=${k}`} className="chip" aria-pressed={f === k} style={{ textDecoration: 'none', minHeight: 36, padding: '8px 12px' }}>{label} ({count(k)})</Link>
          ))}
        </nav>
        {list.length === 0 && <p className="hint">Tidak ada permintaan di filter ini.</p>}
        {list.map((r) => {
          const t = topicById(r.topic);
          const s = r.applicationId ? stores.get(r.applicationId) : undefined;
          return (
            <section key={r.id} className="card" style={{ gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 15 }}>{t?.title ?? r.topic}</strong>
                  <span className="tag">{categoryById(t?.cat ?? '')?.title ?? '-'}</span>
                  <span className={`tag${r.status === 'OPEN' ? ' must' : ' ok'}`}>{HELP_STATUS_LABEL[r.status as HelpStatus] ?? r.status}</span>
                </span>
                <span className="hint">{r.number} · {when(r.createdAt)} WIB</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 13.5 }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong>Telepon</strong>
                  <a href={`tel:${r.phone}`} style={{ fontSize: 16, fontWeight: 800 }}>{r.phone}</a>
                  <span>Waktu: {r.callTime}</span>
                  <span className="hint">Langkah panduan dicoba: {r.triedSteps}/{t?.steps.length ?? '-'}</span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong>Toko</strong>
                  {s ? <Link href={`/admin?id=${s.id}`}>{s.businessName ?? '-'} · {s.ticket}</Link> : <span>-</span>}
                  <span>NMID {s?.nmid ?? '-'}</span>
                  <span className="hint">{r.user.email}</span>
                </span>
              </div>
              {r.note && <p className="note" style={{ margin: 0 }}>“{r.note}”</p>}
              <form action={updateHelpRequest} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 10, alignItems: 'end', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <input type="hidden" name="id" value={r.id} />
                <label className="field">Status
                  <select name="status" className="input" defaultValue={r.status}>{(Object.keys(HELP_STATUS_LABEL) as HelpStatus[]).map((k) => <option key={k} value={k}>{HELP_STATUS_LABEL[k]}</option>)}</select>
                </label>
                <label className="field">Catatan internal{r.handledBy ? ` · terakhir oleh ${r.handledBy}` : ''}
                  <input name="adminNote" className="input" defaultValue={r.adminNote ?? ''} placeholder="Hasil telepon, solusi" />
                </label>
                <button className="btn btn-primary">Simpan</button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
