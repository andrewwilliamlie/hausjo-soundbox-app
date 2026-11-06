// Shop orders in the app: printed QRIS stickers, EDC terminals, the Soundbox and receipt paper. Change products and prices here.
import { rp } from './invoice';

export type Kind = 'STIKER' | 'EDC' | 'SOUNDBOX' | 'KERTAS';
export type Package = { kind: Kind; code: string; name: string; desc: string; normalPrice: number; price: number; max: number };

export const PACKAGES: Package[] = [
  { kind: 'STIKER', code: 'STIKER', name: 'Paket Hemat', desc: 'Stiker QRIS saja', normalPrice: 5000, price: 2500, max: 20 },
  { kind: 'STIKER', code: 'AKRILIK', name: 'Paket Akrilik', desc: 'Stiker QRIS dan stand akrilik', normalPrice: 25000, price: 16000, max: 10 },
  { kind: 'EDC', code: 'A620', name: 'PAX A620', desc: 'Mendukung QRIS dinamis', normalPrice: 699000, price: 699000, max: 5 },
  { kind: 'EDC', code: 'A920PRO', name: 'PAX A920 Pro', desc: 'Mendukung kartu debit, kartu kredit & QRIS', normalPrice: 2999000, price: 2999000, max: 5 },
  { kind: 'SOUNDBOX', code: 'SOUNDBOX', name: 'Soundbox QRIS', desc: 'Menyebut nominal setiap pembayaran QRIS. Sekali bayar, tanpa sewa', normalPrice: 349000, price: 349000, max: 5 },
  { kind: 'KERTAS', code: 'KERTAS10', name: 'Kertas struk thermal', desc: '1 pak isi 10 gulung, ukuran 58 mm', normalPrice: 20000, price: 20000, max: 10 }
];
// Shipping per order, flat to anywhere in Indonesia. Receipt paper ships like stickers (to be confirmed); 0 would show as "Gratis".
export const SHIPPING_FEE: Record<Kind, number> = { STIKER: 10000, EDC: 25000, SOUNDBOX: 25000, KERTAS: 10000 };
export const TIME_SLOTS = ['07.00-12.00', '12.00-17.00', '17.00-22.00'];
export const ADDRESS_LABELS = ['Toko', 'Rumah', 'Kantor'];
export const KINDS: Kind[] = ['STIKER', 'EDC', 'SOUNDBOX', 'KERTAS'];
export const KIND_PREFIX: Record<Kind, string> = { STIKER: 'STK', EDC: 'EDC', SOUNDBOX: 'SBX', KERTAS: 'KRT' };
export const KIND_PATH: Record<Kind, string> = { STIKER: '/app/stiker', EDC: '/app/edc', SOUNDBOX: '/app/soundbox', KERTAS: '/app/kertas' };
export const KIND_NAME: Record<Kind, string> = { STIKER: 'stiker', EDC: 'EDC', SOUNDBOX: 'Soundbox', KERTAS: 'kertas struk' };
export const KIND_LABEL: Record<Kind, string> = { STIKER: 'Stiker', EDC: 'EDC', SOUNDBOX: 'Soundbox', KERTAS: 'Kertas struk' };
export const packagesOf = (kind: Kind) => PACKAGES.filter((p) => p.kind === kind);
export const asKind = (k: string | null | undefined): Kind => (k === 'EDC' || k === 'SOUNDBOX' || k === 'KERTAS' ? k : 'STIKER');

export type OrderItem = { code: string; name: string; qty: number; price: number; normalPrice: number };
export type StickerStatus = 'UNPAID' | 'PAID' | 'PRINTING' | 'SHIPPED' | 'DONE' | 'CANCELLED';
export const FLOW: StickerStatus[] = ['UNPAID', 'PAID', 'PRINTING', 'SHIPPED', 'DONE'];
export const STATUS_LABEL: Record<StickerStatus, string> = {
  UNPAID: 'Menunggu pembayaran', PAID: 'Pembayaran diterima', PRINTING: 'Sedang dicetak',
  SHIPPED: 'Dalam pengiriman', DONE: 'Pesanan diterima', CANCELLED: 'Dibatalkan'
};
/** Status name for an order kind: devices are prepared, not printed. */
export const statusLabel = (s: StickerStatus, kind: Kind = 'STIKER') => (kind !== 'STIKER' && s === 'PRINTING' ? 'Sedang disiapkan' : STATUS_LABEL[s]);
export const STATUS_TONE: Record<StickerStatus, [string, string]> = {
  UNPAID: ['#fff4e5', '#b54708'], PAID: ['#e8f1ff', '#0058d6'], PRINTING: ['#f1edff', '#4a2ba8'],
  SHIPPED: ['#e8f1ff', '#0058d6'], DONE: ['#ecfdf3', '#067647'], CANCELLED: ['#fef3f2', '#b42318']
};

/** Order lines and totals from { code: qty } for one kind; other codes and zero quantities are dropped, quantities capped. */
export function priceOrder(qty: Partial<Record<string, number>>, kind: Kind = 'STIKER') {
  const items: OrderItem[] = packagesOf(kind).flatMap((p) => {
    const q = Math.min(p.max, Math.max(0, Math.floor(qty[p.code] ?? 0)));
    return q ? [{ code: p.code, name: p.name, qty: q, price: p.price, normalPrice: p.normalPrice }] : [];
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const normalTotal = items.reduce((s, i) => s + i.normalPrice * i.qty, 0);
  const shippingFee = items.length ? SHIPPING_FEE[kind] : 0;
  return { items, subtotal, normalTotal, shippingFee, total: subtotal + shippingFee, savings: normalTotal - subtotal };
}

export const itemsText = (items: OrderItem[]) => items.map((i) => `${i.name} x${i.qty}`).join(', ');
export const feeText = (n: number) => (n ? rp(n) : 'Gratis');
export { rp };
