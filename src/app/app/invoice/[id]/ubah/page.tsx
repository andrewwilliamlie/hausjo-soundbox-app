import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import type { InvoiceInput, InvoiceItem } from '@/lib/invoice';
import InvoiceEditor from '../../InvoiceEditor';
import { invoiceContext } from '../../data';

export const metadata = { title: 'Ubah invoice · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await invoiceContext();
  const inv = await db.invoice.findFirst({ where: { id, userId } });
  if (!inv) notFound();
  if (inv.status === 'CANCELLED') redirect(`/app/invoice/${id}`);
  const products = await db.invoiceProduct.findMany({ where: { userId }, orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } });
  const initial: InvoiceInput = {
    customerName: inv.customerName, customerPhone: inv.customerPhone ?? '', orderDate: inv.orderDate, note: inv.note ?? '',
    items: inv.items as unknown as InvoiceItem[], deliveryType: inv.deliveryType as 'ambil' | 'kirim', deliveryAddress: inv.deliveryAddress ?? '',
    deliveryFee: inv.deliveryFee, discountType: inv.discountType as 'rp' | 'pct', discountValue: inv.discountValue, taxPct: inv.taxPct
  };
  return <InvoiceEditor products={products} initial={initial} editId={inv.id} number={inv.number} />;
}
