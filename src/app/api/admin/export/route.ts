import { adminId, audit } from '@/lib/auth';
import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mdrLabel } from '@/lib/rules';

export const dynamic = 'force-dynamic';

// Column order matches the existing QRIS Sheet exactly.
const COLUMNS = [
  'Tgl Pengisian', 'Tgl Req Revisi', 'NAMA LENGKAP PEMILIK USAHA\n(sesuai e-KTP)', 'NIK E-KTP PEMILIK USAHA\n(16 Digit)',
  'NO WHATSAPP PEMILIK USAHA', 'ALAMAT EMAIL\n(Perusahaan/PIC Perusahaan)', 'NAMA USAHA\n(Maks. 25 karakter & Kapital)',
  'MCC - JENIS USAHA', 'nama jalan', 'nomor / blok tempat usaha', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'KOTA / KABUPATEN',
  'KODE POS', 'APAKAH MEMILIKI TOKO FISIK?', 'KATEGORI USAHA\nBERDASARKAN OMZET', 'TIPE QRIS\n(Dinamis/statis/both)',
  'MERCHANT DISCOUNT RATE %\n(MDR)', 'Insentif',
  'KELENGKAPAN DOKUMEN USAHA\n(Individu : KTP & NIB) (Badan Usaha : Dokumen tambahan)', 'WEBSITE',
  'KATEGORI USAHA\nBERDASARKAN RISK', 'Serial Number', 'Tipe EDC', 'MDR HAUSJO (%)', 'PIC Aktivasi', 'Tanggal Aktivasi', 'Status',
  'BANK PENAMPUNG\n(BCA BRI MANDIRI)', 'Nama Pemilik Rekening', 'NO REK PENAMPUNG', 'MPAN', 'MID', 'NMID NOBU', 'NMID BAYARIND',
  'NMID BCA', 'Koneksi (Wajib Diisi)', 'NMID NOBU'
];

const TURNOVER: Record<string, string> = {
  UMI: 'UMI - Penjualan/Tahun: < 2M',
  UKE: 'UKE - Penjualan/Tahun: 2M - 15M',
  UME: 'UME - Penjualan/Tahun: 15M - 50M',
  UBE: 'UBE - Penjualan/Tahun: > 50M'
};

const fmtDate = (d?: Date | null) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }) : '';

export async function GET(req: Request) {
  const aid = await adminId();
  if (!aid) return new NextResponse('Forbidden', { status: 403 });
  const status = new URL(req.url).searchParams.get('status') || 'BANK';
  const allowed = ['BANK', 'ACTIVE', 'SUBMITTED', 'REVISION'];
  const apps = await db.application.findMany({
    where: { status: allowed.includes(status) ? (status as 'BANK') : 'BANK' },
    include: { user: true },
    orderBy: { submittedAt: 'asc' }
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('QRIS');
  ws.addRow(COLUMNS);
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { wrapText: true, vertical: 'middle' };
  const appUrl = process.env.APP_URL || 'https://app.aipos.co.id';

  for (const a of apps) {
    const nmid = a.nmid ?? '';
    const mdr = a.settlement === 'H1' ? '0.00%' : '0.70%';
    ws.addRow([
      fmtDate(a.submittedAt), a.revisionNote ? fmtDate(a.updatedAt) : '', a.ktpName ?? '', a.nik ?? '', a.user.phone, a.user.email,
      (a.businessName ?? '').toUpperCase(), a.mcc ?? '', a.street ?? '', a.number ?? '', a.rt ?? '', a.rw ?? '', a.kelurahan ?? '',
      a.kecamatan ?? '', (a.city ?? '').toUpperCase(), a.postalCode ?? '', a.hasStore ? 'Ya' : 'Tidak', TURNOVER[a.turnover] ?? a.turnover,
      a.qrisType ?? 'S', mdr, '', `${appUrl}/admin?id=${a.id}`, a.onlineLink ?? '', a.riskCategory ?? 'Low Risk',
      a.serialNumber ?? '', '', mdrLabel(a.settlement), '', fmtDate(a.activatedAt), a.status === 'ACTIVE' ? 'Active' : 'Proses',
      a.bankName ?? '', a.accountHolder ?? '', a.accountNo ?? '', a.mpan ?? '', a.mid ?? '',
      a.routedBank === 'NOBU' ? nmid : '', a.routedBank === 'BAYARIND' ? nmid : '', a.routedBank === 'BCA' ? nmid : '', '',
      a.routedBank === 'NOBU' ? nmid : ''
    ]);
  }
  // Keep NIK, phone and account numbers as text so Excel does not round them.
  for (const col of [4, 5, 33, 34, 35]) ws.getColumn(col).numFmt = '@';
  ws.columns.forEach((c) => (c.width = 20));

  await audit(aid, 'EXPORT_QRIS', undefined, `${status}: ${apps.length} rows`);
  const buf = await wb.xlsx.writeBuffer();
  const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf as unknown as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="QRIS_Sheet_${status}_${day}.xlsx"`,
      'Cache-Control': 'no-store'
    }
  });
}
