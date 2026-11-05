// Draws the invoice as a 1080 px wide PNG with the store's QRIS sticker, ready to share on WhatsApp.
// Ported from AIPOS Invoice (invoice.aipos.co.id) so invoices look the same.
import { fmtDate, rp, type InvoiceItem, type Status } from '@/lib/invoice';

export type DrawInvoice = {
  number: string; createdAt: string; customerName: string; customerPhone: string; orderDate: string; note: string;
  items: InvoiceItem[]; deliveryType: string; deliveryAddress: string; deliveryFee: number;
  subtotal: number; discount: number; tax: number; taxPct: number; total: number; status: Status; payMethod: string;
};
export type DrawShop = { name: string; phone: string; address: string; nmid: string | null };

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = String(text || '').split(/\s+/); const lines: string[] = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW) cur = t;
    else {
      if (cur) lines.push(cur);
      cur = w;
      while (ctx.measureText(cur).width > maxW && cur.length > 1) {
        let k = cur.length; while (k > 1 && ctx.measureText(cur.slice(0, k)).width > maxW) k--;
        lines.push(cur.slice(0, k)); cur = cur.slice(k);
      }
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export async function drawInvoice(inv: DrawInvoice, shop: DrawShop, qrisUrl: string | null): Promise<Blob> {
  const F = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  try { await document.fonts.ready; } catch { /* system font is fine */ }
  const qimg = qrisUrl ? await loadImg(qrisUrl).catch(() => null) : null;
  const W = 1080, P = 64, big = document.createElement('canvas'); big.width = W; big.height = 6000;
  const c = big.getContext('2d')!;
  const BLUE = '#0069FC', INK = '#0E1B33', MUT = '#5A6A84', LINE = '#E1E7F0';
  const font = (w: number, s: number) => { c.font = `${w} ${s}px ${F}`; };
  const txt = (s: string, x: number, y: number, col: string, align: CanvasTextAlign = 'left') => { c.fillStyle = col; c.textAlign = align; c.fillText(s, x, y); };
  const spacing = (v: string) => { (c as unknown as { letterSpacing: string }).letterSpacing = v; };
  const paid = ['PAID', 'SHIPPED', 'DONE'].includes(inv.status);
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, 6000);

  // Header band: store on the left, INVOICE + number on the right
  c.fillStyle = BLUE; c.fillRect(0, 0, W, 240);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.arc(W - 40, 20, 170, 0, Math.PI * 2); c.fill();
  font(800, 46); const shopLines = wrap(c, shop.name, 560).slice(0, 2); shopLines.forEach((l, i) => txt(l, P, 100 + i * 54, '#fff'));
  let hy = 100 + shopLines.length * 54 - 10; font(500, 24);
  if (shop.phone) { txt('WhatsApp ' + shop.phone, P, hy, 'rgba(255,255,255,.9)'); hy += 34; }
  if (shop.address) txt(wrap(c, shop.address, 560)[0], P, hy, 'rgba(255,255,255,.9)');
  font(800, 34); spacing('6px'); txt('INVOICE', W - P + 6, 100, '#fff', 'right'); spacing('0px');
  font(600, 24); txt(inv.number, W - P, 142, 'rgba(255,255,255,.92)', 'right');
  font(500, 22); txt(new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), W - P, 176, 'rgba(255,255,255,.85)', 'right');

  // Status stamp
  let y = 300;
  const sl = inv.status === 'CANCELLED' ? 'DIBATALKAN' : paid ? 'LUNAS' : 'BELUM DIBAYAR';
  font(800, 20); spacing('2px'); const sw = c.measureText(sl).width + 40;
  c.fillStyle = paid ? '#E3F5EC' : inv.status === 'CANCELLED' ? '#FEE4E2' : '#FFF3DC'; rr(c, W - P - sw, y - 30, sw, 44, 22); c.fill();
  txt(sl, W - P - sw / 2 + 1, y, paid ? '#0E7F57' : inv.status === 'CANCELLED' ? '#B42318' : '#9A5B00', 'center'); spacing('0px');

  // Bill to / delivery
  const label = (s: string, x: number, yy: number) => { font(700, 19); spacing('2px'); txt(s, x, yy, MUT); spacing('0px'); };
  label('DITAGIHKAN KE', P, y); font(700, 30); let ly = y + 44;
  wrap(c, inv.customerName, 420).forEach((l) => { txt(l, P, ly, INK); ly += 38; });
  font(500, 24); if (inv.customerPhone) { txt(inv.customerPhone, P, ly, MUT); ly += 34; }
  let ry = y + 70; const RX = 560; label(inv.deliveryType === 'kirim' ? 'DIKIRIM KE' : 'PENGAMBILAN', RX, ry); ry += 38; font(500, 24);
  if (inv.deliveryType === 'kirim') wrap(c, inv.deliveryAddress, W - P - RX).slice(0, 4).forEach((l) => { txt(l, RX, ry, INK); ry += 32; });
  else { txt('Diambil langsung di toko', RX, ry, INK); ry += 32; }
  ry += 10; txt('Pesanan untuk: ' + fmtDate(inv.orderDate), RX, ry, MUT); ry += 32;
  if (inv.note) wrap(c, 'Catatan: ' + inv.note, W - P - RX).slice(0, 3).forEach((l) => { txt(l, RX, ry, MUT); ry += 32; });
  y = Math.max(ly, ry) + 36;

  // Items table
  const CQ = 640, CH = 820, CJ = W - P - 24;
  c.fillStyle = '#EEF4FF'; rr(c, P, y, W - 2 * P, 60, 12); c.fill();
  font(700, 21); txt('Produk', P + 24, y + 38, BLUE); txt('Qty', CQ, y + 38, BLUE, 'center'); txt('Harga', CH, y + 38, BLUE, 'right'); txt('Jumlah', CJ, y + 38, BLUE, 'right');
  y += 60;
  inv.items.forEach((it) => {
    let iy = y + 42; font(600, 25); const nl = wrap(c, it.name, CQ - P - 80);
    nl.forEach((l, i) => txt(l, P + 24, iy + i * 32, INK)); font(500, 24);
    txt(String(it.qty), CQ, iy, INK, 'center'); txt(rp(it.price), CH, iy, MUT, 'right'); font(700, 24); txt(rp(it.price * it.qty), CJ, iy, INK, 'right');
    iy += (nl.length - 1) * 32;
    if (it.note) { font(500, 20); wrap(c, it.note, CQ - P - 80).slice(0, 2).forEach((l) => { iy += 28; txt(l, P + 24, iy, MUT); }); }
    y = iy + 26; c.fillStyle = LINE; c.fillRect(P, y, W - 2 * P, 2);
  });

  // Totals
  y += 44; const TL = 600; font(500, 24);
  const trow = (l: string, v: string) => { txt(l, TL, y, MUT); txt(v, CJ, y, INK, 'right'); y += 40; };
  trow('Subtotal', rp(inv.subtotal));
  if (inv.discount) trow('Diskon', '−' + rp(inv.discount));
  if (inv.tax) trow(`Pajak (${inv.taxPct}%)`, rp(inv.tax));
  if (inv.deliveryType === 'kirim') trow('Ongkos kirim', rp(inv.deliveryFee));
  y += 6; c.fillStyle = BLUE; rr(c, P, y, W - 2 * P, 96, 16); c.fill();
  font(700, 26); spacing('3px'); txt('TOTAL', P + 32, y + 59, '#fff'); spacing('0px');
  font(800, 44); txt(rp(inv.total), W - P - 32, y + 64, '#fff', 'right'); y += 96 + 40;

  // Payment block: the QRIS sticker with steps, or plain instructions when QRIS is not active yet
  // Fit the whole sticker (it may be a tall poster) into a 380 × 620 slot without cropping the QR code.
  const fit = qimg ? Math.min(380 / qimg.width, 620 / qimg.height) : 0;
  const QW = qimg ? Math.round(qimg.width * fit) : 0;
  const QH = qimg ? Math.round(qimg.height * fit) : 0;
  const BH = Math.max(QH + 56, qimg ? 470 : 300);
  c.fillStyle = '#F3F6FB'; rr(c, P, y, W - 2 * P, BH, 20); c.fill();
  if (qimg) {
    c.save(); rr(c, P + 28, y + 28, QW, QH, 12); c.clip();
    c.drawImage(qimg, P + 28, y + 28, QW, QH); c.restore();
    c.strokeStyle = LINE; c.lineWidth = 2; rr(c, P + 28, y + 28, QW, QH, 12); c.stroke();
  }
  const TX = qimg ? P + 28 + 380 + 36 : P + 36, TW = W - P - 28 - TX; let ty = y + 74;
  font(800, 32); txt(paid ? 'Sudah dibayar' : qimg ? 'Bayar dengan QRIS' : 'Cara pembayaran', TX, ty, INK); ty += 38;
  font(500, 21);
  wrap(c, paid ? 'Terima kasih, pembayaran untuk invoice ini sudah kami terima.' : qimg ? 'Bisa pakai semua aplikasi bank dan e-wallet.' : 'Hubungi penjual untuk pembayaran lewat transfer atau tunai.', TW)
    .forEach((l) => { txt(l, TX, ty, MUT); ty += 30; });
  ty += 18;
  if (!paid && inv.status !== 'CANCELLED') {
    const steps = qimg
      ? ['Buka aplikasi bank atau e-wallet', 'Scan kode QRIS di samping', 'Masukkan nominal sesuai total', shop.phone ? 'Kirim bukti bayar ke WA ' + shop.phone : 'Kirim bukti bayar ke penjual']
      : [shop.phone ? 'Kirim bukti bayar ke WA ' + shop.phone : 'Kirim bukti bayar ke penjual'];
    steps.forEach((s, i) => {
      c.fillStyle = BLUE; c.beginPath(); c.arc(TX + 15, ty - 8, 15, 0, Math.PI * 2); c.fill(); font(700, 17); txt(String(i + 1), TX + 15, ty - 2, '#fff', 'center');
      font(500, 21); const sl2 = wrap(c, s, TW - 44); sl2.forEach((l, j) => txt(l, TX + 44, ty + j * 28, INK)); ty += sl2.length * 28 + 16;
    });
    ty += 6; c.fillStyle = '#fff'; rr(c, TX, ty, TW, 92, 14); c.fill(); c.strokeStyle = BLUE; c.lineWidth = 2; rr(c, TX, ty, TW, 92, 14); c.stroke();
    font(600, 18); txt('Nominal yang dibayar', TX + 20, ty + 32, MUT); font(800, 34); txt(rp(inv.total), TX + 20, ty + 74, BLUE);
  } else if (paid && inv.payMethod) { font(600, 22); txt('Metode: ' + inv.payMethod, TX, ty, INK); }
  y += BH + 44;
  font(500, 19); txt(`Invoice dibuat dengan AIPOS${shop.nmid ? ' · NMID ' + shop.nmid : ''}`, W / 2, y, MUT, 'center');
  y += 44;

  const out = document.createElement('canvas'); out.width = W; out.height = y; out.getContext('2d')!.drawImage(big, 0, 0);
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/png'));
}
