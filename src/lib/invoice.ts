// Shared invoice rules (client and server): totals, status labels, formatting.

export type InvoiceItem = { productId?: string | null; name: string; price: number; qty: number; note?: string };
export type InvoiceInput = {
  customerName: string;
  customerPhone: string;
  orderDate: string;
  note: string;
  items: InvoiceItem[];
  deliveryType: 'ambil' | 'kirim';
  deliveryAddress: string;
  deliveryFee: number;
  discountType: 'rp' | 'pct';
  discountValue: number;
  taxPct: number;
};
export type Status = 'UNPAID' | 'PAID' | 'SHIPPED' | 'DONE' | 'CANCELLED';

export const FLOW: Status[] = ['UNPAID', 'PAID', 'SHIPPED', 'DONE'];
export const PAY_METHODS = ['QRIS', 'Transfer bank', 'Tunai', 'COD', 'Lainnya'];

export function statusLabel(s: Status, deliveryType?: string) {
  if (s === 'SHIPPED') return deliveryType === 'ambil' ? 'Siap diambil' : 'Dikirim';
  return { UNPAID: 'Belum dibayar', PAID: 'Sudah dibayar', DONE: 'Selesai', CANCELLED: 'Dibatalkan' }[s] ?? s;
}
export const STATUS_TONE: Record<Status, [string, string]> = {
  UNPAID: ['#fff4e5', '#b54708'], PAID: ['#ecfdf3', '#067647'], SHIPPED: ['#e8f1ff', '#0058d6'], DONE: ['#eef1f6', '#344054'], CANCELLED: ['#fef3f2', '#b42318']
};

export function totals(d: Pick<InvoiceInput, 'items' | 'discountType' | 'discountValue' | 'taxPct' | 'deliveryType' | 'deliveryFee'>) {
  const subtotal = d.items.reduce((s, i) => s + Math.round(i.price) * i.qty, 0);
  let discount = d.discountType === 'pct' ? Math.round((subtotal * Math.min(100, d.discountValue || 0)) / 100) : d.discountValue || 0;
  discount = Math.max(0, Math.min(discount, subtotal));
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * (d.taxPct || 0)) / 100);
  const fee = d.deliveryType === 'kirim' ? Math.max(0, d.deliveryFee || 0) : 0;
  return { subtotal, discount, tax, fee, total: taxable + tax + fee, count: d.items.reduce((s, i) => s + i.qty, 0) };
}

export const rp = (n: number) => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
export const todayISO = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10); // Jakarta date
export const fmtDate = (iso: string) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
export const waNumber = (p: string) => { let d = (p || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); else if (d.startsWith('8')) d = '62' + d; return d; };
export const phoneOk = (p: string) => { let d = (p || '').replace(/\D/g, ''); if (d.startsWith('62')) d = '0' + d.slice(2); return /^08\d{8,11}$/.test(d); };

/** Default invoice code from the store name: initials of up to 3 words, e.g. "WARUNG MAKAN RINA" → WMR. */
export function codeFromName(name: string) {
  const words = (name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const c = words.length >= 2 ? words.slice(0, 3).map((w) => w[0]).join('') : (words[0] ?? 'INV').slice(0, 3);
  return c || 'INV';
}

/** WhatsApp message sent with the invoice image. */
export function waText(inv: { customerName: string; number: string; orderDate: string; items: InvoiceItem[]; discount: number; tax: number; taxPct: number; deliveryType: string; deliveryFee: number; total: number; status: Status }, shopName: string, hasQris: boolean) {
  const L: string[] = [];
  L.push(`Halo ${inv.customerName}, berikut invoice dari ${shopName}.`, '');
  L.push(`No. invoice: ${inv.number}`, `Tanggal pesanan: ${fmtDate(inv.orderDate)}`, '');
  inv.items.forEach((i) => L.push(`• ${i.name} x${i.qty} = ${rp(i.price * i.qty)}`));
  if (inv.discount) L.push(`Diskon: -${rp(inv.discount)}`);
  if (inv.tax) L.push(`Pajak (${inv.taxPct}%): ${rp(inv.tax)}`);
  if (inv.deliveryType === 'kirim') L.push(`Ongkos kirim: ${rp(inv.deliveryFee)}`);
  L.push(`*Total: ${rp(inv.total)}*`, '');
  if (inv.status === 'UNPAID') {
    L.push(hasQris
      ? `Pembayaran via QRIS (ada di gambar invoice): scan kodenya, lalu masukkan nominal *${rp(inv.total)}*. Bisa pakai semua aplikasi bank & e-wallet.`
      : `Silakan lakukan pembayaran sebesar *${rp(inv.total)}*.`, '', 'Setelah bayar, mohon kirim bukti pembayaran ya. Terima kasih!');
  } else if (inv.status !== 'CANCELLED') L.push('Status: LUNAS. Terima kasih sudah berbelanja!');
  return L.join('\n');
}
