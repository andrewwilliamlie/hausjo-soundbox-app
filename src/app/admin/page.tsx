import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkBusinessName } from '@/lib/rules';
import AdminHeader from './AdminHeader';
import ResetLink from './ResetLink';
import {
  activate, approve, decideDoc, markGuided, markSoundboxPaid, saveClassification, sendRevision, ship
} from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin HausJo' };

const STATUS: Record<string, [string, string, string]> = {
  SUBMITTED: ['Baru', '#eaf2ff', '#1f4fb0'],
  REVISION: ['Perlu revisi', '#fff4e5', '#93370d'],
  BANK: ['Proses bank', '#f1edff', '#4a2ba8'],
  ACTIVE: ['QRIS aktif', '#ecfdf3', '#05603a'],
  REJECTED: ['Ditolak', '#fef3f2', '#912018']
};
const DOC_LABEL: Record<string, string> = { KTP: 'Foto e-KTP', SELFIE: 'Selfie + e-KTP', STORE_FRONT: 'Depan toko', PRODUCT: 'Produk di toko' };
const SB_LABEL: Record<string, string> = { NONE: 'QRIS saja', BUY: 'Beli di aplikasi', MARKETPLACE: 'Marketplace', SALES: 'Sales lapangan', ARRIVED: 'Sudah sampai' };
const REASONS = ['Foto buram', 'Wajah tidak sama dengan KTP', 'Nama toko tidak terlihat', 'Dokumen terpotong', 'Bukan dokumen asli'];
const MCC = ['5812 - Restoran dan Tempat Makan', '5411 - Toko Kelontong / Supermarket', '5814 - Makanan Cepat Saji', '4814 - Pulsa & Telekomunikasi', '7210 - Laundry', '5499 - Toko Makanan Lainnya', '5699 - Pakaian & Aksesoris', '7230 - Salon & Barbershop', '7538 - Bengkel', '5999 - Toko Ritel Lainnya'];

function pill(status: string) {
  const [label, bg, fg] = STATUS[status] ?? [status, '#eee', '#333'];
  return <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>{label}</span>;
}

function Flag({ bad, children }: { bad: boolean; children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.45, padding: '10px 12px', borderRadius: 10, background: bad ? '#fef3f2' : '#ecfdf3', color: bad ? '#912018' : '#05603a' }}><span aria-hidden="true">{bad ? '!' : '✓'}</span><span>{children}</span></div>;
}

const kv = (label: string, value: React.ReactNode) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 14 }}><span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span><span>{value || '–'}</span></div>
);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ f?: string; id?: string }> }) {
  const admin = await requireAdmin();
  const { f = 'all', id } = await searchParams;

  const base: Prisma.ApplicationWhereInput = { status: { not: 'DRAFT' } };
  const filters: Array<[string, string, Prisma.ApplicationWhereInput]> = [
    ['all', 'Semua', base],
    ['baru', 'Baru', { status: 'SUBMITTED' }],
    ['rekening', 'Menunggu rekening', { status: { in: ['SUBMITTED', 'REVISION'] }, accountNo: null }],
    ['revisi', 'Perlu revisi', { status: 'REVISION' }],
    ['bank', 'Proses bank', { status: 'BANK' }],
    ['aktif', 'QRIS aktif', { status: 'ACTIVE' }],
    ['panduan', 'Perlu panduan aktivasi', { needsGuide: true, guidedAt: null, status: { not: 'DRAFT' } }]
  ];
  const counts = await Promise.all(filters.map(([, , w]) => db.application.count({ where: w })));
  const where = (filters.find(([k]) => k === f) ?? filters[0])[2];
  const list = await db.application.findMany({ where, orderBy: { submittedAt: 'asc' }, take: 200 });

  const cur = id
    ? await db.application.findUnique({ where: { id }, include: { documents: { orderBy: { createdAt: 'asc' } }, user: true } })
    : null;

  const docs = cur?.documents.filter((d) => d.kind in DOC_LABEL) ?? [];
  const sticker = cur?.documents.find((d) => d.kind === 'QRIS_STICKER');
  const nameCheck = checkBusinessName(cur?.businessName ?? '');
  const allOk = cur ? ['KTP', 'SELFIE', 'STORE_FRONT', 'PRODUCT'].every((k) => docs.some((d) => d.kind === k && d.decision === 'APPROVED')) : false;
  const nRej = docs.filter((d) => d.decision === 'REJECTED').length;
  const editable = cur && ['SUBMITTED', 'REVISION'].includes(cur.status);
  const canApprove = !!cur && allOk && nameCheck.ok && !!cur.accountNo && !!cur.routedBank;
  let hint = 'Periksa setiap foto, pilih bank, lalu setujui.';
  if (cur && !cur.accountNo) hint = 'Menunggu merchant menambah rekening. Foto tetap bisa diperiksa sekarang.';
  else if (nRej) hint = `${nRej} foto ditolak. Kirim permintaan revisi; merchant hanya mengunggah ulang foto itu.`;
  else if (!nameCheck.ok) hint = 'Nama usaha melanggar aturan bank. Minta revisi.';
  else if (cur && !cur.routedBank) hint = 'Pilih bank tujuan (BCA, Nobu atau Bayarind) di Klasifikasi.';
  const q = (o: Record<string, string>) => '/admin?' + new URLSearchParams({ f, ...o }).toString();

  return (
    <div className="admin">
      <AdminHeader admin={admin} tab="antrean" />

      <div className="admin-wrap">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <nav aria-label="Filter status" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filters.map(([k, label], i) => (
              <Link key={k} href={'/admin?f=' + k} className="chip" aria-pressed={f === k} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{label} ({counts[i]})</Link>
            ))}
          </nav>
          <a className="btn btn-ghost" href="/api/admin/export?status=BANK">Unduh Sheet QRIS (.xlsx) · {counts[4]} siap</a>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <section aria-label="Daftar pendaftaran" className="card" style={{ flex: '1 1 300px', padding: 0, gap: 0, overflow: 'hidden' }}>
            <div className="hint" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>{list.length} pendaftaran · terlama di atas</div>
            {list.length === 0 && <p className="hint" style={{ padding: 16 }}>Tidak ada pendaftaran di sini.</p>}
            {list.map((a) => (
              <Link key={a.id} href={q({ id: a.id })} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'var(--ink)', background: a.id === id ? 'var(--blue-soft)' : '#fff', boxShadow: a.id === id ? 'inset 3px 0 0 var(--blue)' : 'none' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 14 }}>{a.businessName}</strong>{pill(a.status)}</span>
                <span className="hint">{a.product === 'SOUNDBOX' ? 'Soundbox QRIS' : 'QRIS saja'} · {a.city ?? '–'}{a.accountNo ? '' : ' · belum ada rekening'}</span>
                <span className="hint">{a.ticket} · {a.submittedAt?.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
              </Link>
            ))}
          </section>

          <section aria-label="Detail pendaftaran" style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!cur && <div className="card"><p className="hint">Pilih pendaftaran di sebelah kiri.</p></div>}
            {cur && (
              <>
                <div className="card" style={{ gap: 14 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                    <div><span className="hint">{cur.ticket} · diajukan {cur.submittedAt?.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span><h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>{cur.businessName}</h1></div>
                    {pill(cur.status)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    {kv('Pemilik (e-KTP)', cur.ktpName)}
                    {kv('NIK', cur.nik)}
                    {kv('Lahir', [cur.birthPlace, cur.birthDate].filter(Boolean).join(', '))}
                    {kv('WhatsApp', cur.user.phone)}
                    {kv('Email', cur.user.email)}
                    {kv('Produk', `${cur.product === 'SOUNDBOX' ? 'Soundbox QRIS' : 'QRIS saja'} · ${SB_LABEL[cur.soundboxStatus]}${cur.orderNo ? ' · ' + cur.marketplace + ' ' + cur.orderNo : ''}${cur.salesName ? ' · ' + cur.salesName : ''}`)}
                    {kv('Alamat', `${cur.street ?? ''} ${cur.number ?? ''} RT ${cur.rt ?? '-'}/RW ${cur.rw ?? '-'}, ${cur.kelurahan}, ${cur.kecamatan}, ${cur.city}, ${cur.province} ${cur.postalCode ?? ''}${cur.villageCode ? ' · kode wilayah ' + cur.villageCode : ' · diketik manual'}`)}
                    {kv('Toko', `${cur.hasStore ? 'Punya toko' : 'Tidak punya toko'} · ${cur.businessType ?? ''}`)}
                    {kv('Rekening', cur.accountNo ? `${cur.bankName} ${cur.accountNo} a.n. ${cur.accountHolder}` : 'Belum ditambahkan')}
                    {kv('Pencairan', cur.settlement === 'H1' ? 'H+1' : 'Hari yang sama')}
                    {kv('Referral', cur.user.referralCode)}
                    {kv('Lokasi', cur.lat != null ? <a href={`https://maps.google.com/?q=${cur.lat},${cur.lng}`} target="_blank" rel="noreferrer">Buka peta</a> : '–')}
                  </div>
                  <Flag bad={!nameCheck.ok}>{nameCheck.ok ? `Nama usaha lolos aturan bank (${(cur.businessName ?? '').length}/25).` : 'Nama usaha: ' + nameCheck.message}</Flag>
                  {cur.ocrConfidence != null
                    ? <Flag bad={cur.ocrConfidence < 90 || cur.ocrEdited}>OCR e-KTP {cur.ocrConfidence}%{cur.ocrEdited ? ', dan merchant mengubah hasil OCR' : ''}. {cur.ocrConfidence < 90 || cur.ocrEdited ? 'Cocokkan NIK dengan foto KTP.' : 'Tidak diubah merchant.'}</Flag>
                    : <Flag bad={false}>Data KTP diketik merchant (OCR belum aktif). Cocokkan dengan foto KTP.</Flag>}
                  {cur.livenessPassed != null && (
                    <Flag bad={!cur.livenessPassed}>{cur.livenessPassed
                      ? `Selfie diambil lewat cek wajah di HP merchant (${cur.livenessNote}). Tetap cocokkan wajah dengan foto e-KTP.`
                      : `Selfie diunggah tanpa cek wajah: ${cur.livenessNote}. Periksa lebih teliti apakah ini foto langsung.`}</Flag>
                  )}
                  {!cur.accountNo && <Flag bad>Merchant belum menambah rekening. Persetujuan dikunci sampai rekening ada.</Flag>}
                </div>

                <div className="card" style={{ gap: 14 }}>
                  <p className="hint" style={{ fontWeight: 700, letterSpacing: .6 }}>PEMERIKSAAN FOTO</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {docs.map((d) => (
                      <div key={d.id} style={{ border: `1px solid ${d.decision === 'APPROVED' ? 'var(--ok)' : d.decision === 'REJECTED' ? 'var(--err)' : 'var(--line)'}`, borderRadius: 12, overflow: 'hidden' }}>
                        <a href={`/api/files/${d.id}`} target="_blank" rel="noreferrer"><img src={`/api/files/${d.id}`} alt={DOC_LABEL[d.kind]} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', background: '#eef3fa' }} /></a>
                        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <strong style={{ fontSize: 13 }}>{DOC_LABEL[d.kind]}{d.decision === 'REJECTED' ? ` · ditolak: ${d.rejectReason}` : d.decision === 'APPROVED' ? ' · disetujui' : ''}</strong>
                          {editable && (
                            <>
                              <form action={decideDoc}><input type="hidden" name="docId" value={d.id} /><input type="hidden" name="decision" value="APPROVED" /><button className="btn btn-ghost btn-block" style={{ minHeight: 38, fontSize: 13 }}>Setujui</button></form>
                              <form action={decideDoc} style={{ display: 'flex', gap: 6 }}>
                                <input type="hidden" name="docId" value={d.id} /><input type="hidden" name="decision" value="REJECTED" />
                                <select name="reason" className="input" style={{ minHeight: 38, fontSize: 12.5, padding: '6px 8px' }} aria-label="Alasan tolak">{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                                <button className="btn" style={{ minHeight: 38, fontSize: 13, background: 'var(--err)', color: '#fff' }}>Tolak</button>
                              </form>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form action={saveClassification} className="card" style={{ gap: 14 }}>
                  <input type="hidden" name="id" value={cur.id} />
                  <p className="hint" style={{ fontWeight: 700, letterSpacing: .6 }}>KLASIFIKASI &amp; BANK</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <label className="field">MCC – jenis usaha<select name="mcc" className="input" defaultValue={cur.mcc ?? ''}><option value="">Pilih MCC</option>{MCC.map((m) => <option key={m}>{m}</option>)}</select></label>
                    <label className="field">Kategori omzet<select name="turnover" className="input" defaultValue={cur.turnover}><option value="UMI">UMI – &lt; Rp2 M/tahun</option><option value="UKE">UKE</option><option value="UME">UME</option><option value="UBE">UBE</option></select></label>
                    <label className="field">Kategori risiko<select name="riskCategory" className="input" defaultValue={cur.riskCategory ?? 'Low Risk'}><option>Low Risk</option><option>Medium Risk</option><option>High Risk</option></select></label>
                    <label className="field">Tipe QRIS<select name="qrisType" className="input" defaultValue={cur.qrisType ?? 'S'}><option value="S">Statis</option><option value="D">Dinamis</option><option value="B">Both</option></select></label>
                    <label className="field">Bank tujuan<select name="routedBank" className="input" defaultValue={cur.routedBank ?? ''}><option value="">Pilih bank</option><option value="BCA">BCA</option><option value="NOBU">Nobu</option><option value="BAYARIND">Bayarind</option></select></label>
                  </div>
                  <div><button className="btn btn-ghost">Simpan klasifikasi</button></div>
                </form>

                {editable && (
                  <div className="card" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span className="hint" style={{ flex: '1 1 260px' }}>{hint}</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <form action={sendRevision}><input type="hidden" name="id" value={cur.id} /><button className="btn" disabled={!nRej && nameCheck.ok} style={{ background: !nRej && nameCheck.ok ? '#c9d3e3' : 'var(--warn)', color: '#fff' }}>Minta revisi</button></form>
                      <form action={approve}><input type="hidden" name="id" value={cur.id} /><button className="btn btn-primary" disabled={!canApprove}>Setujui &amp; kirim ke {cur.routedBank ?? 'bank'}</button></form>
                    </div>
                  </div>
                )}

                {(cur.status === 'BANK' || cur.status === 'ACTIVE') && (
                  <form action={activate} className="card" style={{ gap: 14, borderColor: '#b4a3f0' }}>
                    <input type="hidden" name="id" value={cur.id} />
                    <p className="hint" style={{ fontWeight: 700, letterSpacing: .6 }}>ID DARI BANK · {cur.routedBank}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      <label className="field">MPAN<input name="mpan" className="input" defaultValue={cur.mpan ?? ''} /></label>
                      <label className="field">MID<input name="mid" className="input" defaultValue={cur.mid ?? ''} /></label>
                      <label className="field">NMID {cur.routedBank}<input name="nmid" className="input" defaultValue={cur.nmid ?? ''} placeholder="ID10xxxxxxxxxxx" /></label>
                    </div>
                    <label className="field">Stiker QRIS dari bank (PNG, JPG atau PDF, maks. 8 MB)
                      <input name="sticker" type="file" accept="image/png,image/jpeg,application/pdf" className="input" />
                      {sticker && <a href={`/api/files/${sticker.id}`} target="_blank" rel="noreferrer">Lihat stiker saat ini</a>}
                    </label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary">{cur.status === 'ACTIVE' ? 'Simpan perubahan' : 'Simpan & aktifkan QRIS'}</button>
                      <span className="hint">{cur.status === 'ACTIVE' ? 'QRIS sudah aktif.' : 'Aktif bila NMID dan stiker sudah ada. Merchant menerima stiker di aplikasi dan email. PIC Aktivasi diisi tim di sheet.'}</span>
                    </div>
                  </form>
                )}

                {cur.product === 'SOUNDBOX' && (
                  <form action={ship} className="card" style={{ gap: 14 }}>
                    <input type="hidden" name="id" value={cur.id} />
                    <p className="hint" style={{ fontWeight: 700, letterSpacing: .6 }}>SOUNDBOX · {SB_LABEL[cur.soundboxStatus]}{cur.soundboxPaidAt ? ' · dibayar' : ''}{cur.shippedAt ? ' · dikirim' : ''}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                      <label className="field">Serial Number<input name="serialNumber" className="input" defaultValue={cur.serialNumber ?? ''} /></label>
                      <label className="field">Kurir<select name="courier" className="input" defaultValue={cur.courier ?? 'JNE'}><option>JNE</option><option>J&amp;T</option><option>SiCepat</option><option>Antar sendiri</option></select></label>
                      <label className="field">No. resi<input name="trackingNo" className="input" defaultValue={cur.trackingNo ?? ''} /></label>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost">Simpan pengiriman</button>
                      {cur.soundboxStatus === 'BUY' && !cur.soundboxPaidAt && <button className="btn btn-ghost" formAction={markSoundboxPaid}>Tandai sudah dibayar</button>}
                    </div>
                  </form>
                )}

                <ResetLink key={cur.id} id={cur.id} phone={cur.user.phone} />

                {cur.needsGuide && !cur.guidedAt && (
                  <form action={markGuided} className="card" style={{ gap: 12, background: '#fffcf5', borderColor: '#fec84b' }}>
                    <input type="hidden" name="id" value={cur.id} />
                    <p className="hint" style={{ fontWeight: 700, letterSpacing: .6, color: '#93370d' }}>PERLU PANDUAN AKTIVASI SOUNDBOX</p>
                    <span style={{ fontSize: 14 }}>SN <strong>{cur.serialNumber}</strong> · WhatsApp {cur.user.phone}</span>
                    <span className="hint">Pandu merchant: nyalakan Soundbox, sambungkan Wi-Fi atau kartu SIM, lalu tes satu pembayaran QRIS kecil sampai berbunyi.</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <a className="btn" style={{ background: 'var(--ok)', color: '#fff' }} href={`https://wa.me/62${cur.user.phone.replace(/^0/, '')}`} target="_blank" rel="noreferrer">Hubungi via WhatsApp</a>
                      <button className="btn btn-ghost">Tandai sudah dipandu</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
