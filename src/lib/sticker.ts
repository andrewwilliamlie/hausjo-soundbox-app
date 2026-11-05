// Printed QRIS sticker orders: packages, prices and statuses. Change prices here.
import { rp } from './invoice';

export type PackageCode = 'STIKER' | 'AKRILIK';
export type Package = { code: PackageCode; name: string; desc: string; normalPrice: number; price: number; max: number };

export const PACKAGES: Package[] = [
  { code: 'STIKER', name: 'Paket Hemat', desc: 'Stiker QRIS saja', normalPrice: 5000, price: 2500, max: 20 },
  { code: 'AKRILIK', name: 'Paket Akrilik', desc: 'Stiker QRIS dan stand akrilik', normalPrice: 25000, price: 16000, max: 10 }
];
export const SHIPPING_FEE = 10000;
export const TIME_SLOTS = ['07.00-12.00', '12.00-17.00', '17.00-22.00'];
export const ADDRESS_LABELS = ['Toko', 'Rumah', 'Kantor'];

export type OrderItem = { code: PackageCode; name: string; qty: number; price: number; normalPrice: number };
export type StickerStatus = 'UNPAID' | 'PAID' | 'PRINTING' | 'SHIPPED' | 'DONE' | 'CANCELLED';
export const FLOW: StickerStatus[] = ['UNPAID', 'PAID', 'PRINTING', 'SHIPPED', 'DONE'];
export const STATUS_LABEL: Record<StickerStatus, string> = {
  UNPAID: 'Menunggu pembayaran', PAID: 'Pembayaran diterima', PRINTING: 'Sedang dicetak',
  SHIPPED: 'Dalam pengiriman', DONE: 'Pesanan diterima', CANCELLED: 'Dibatalkan'
};
export const STATUS_TONE: Record<StickerStatus, [string, string]> = {
  UNPAID: ['#fff4e5', '#b54708'], PAID: ['#e8f1ff', '#0058d6'], PRINTING: ['#f1edff', '#4a2ba8'],
  SHIPPED: ['#e8f1ff', '#0058d6'], DONE: ['#ecfdf3', '#067647'], CANCELLED: ['#fef3f2', '#b42318']
};

/** Order lines and totals from { code: qty }; unknown codes and zero quantities are dropped, quantities capped. */
export function priceOrder(qty: Partial<Record<string, number>>) {
  const items: OrderItem[] = PACKAGES.flatMap((p) => {
    const q = Math.min(p.max, Math.max(0, Math.floor(qty[p.code] ?? 0)));
    return q ? [{ code: p.code, name: p.name, qty: q, price: p.price, normalPrice: p.normalPrice }] : [];
  });
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const normalTotal = items.reduce((s, i) => s + i.normalPrice * i.qty, 0);
  const shippingFee = items.length ? SHIPPING_FEE : 0;
  return { items, subtotal, normalTotal, shippingFee, total: subtotal + shippingFee, savings: normalTotal - subtotal };
}

export const itemsText = (items: OrderItem[]) => items.map((i) => `${i.name} x${i.qty}`).join(', ');
export { rp };
