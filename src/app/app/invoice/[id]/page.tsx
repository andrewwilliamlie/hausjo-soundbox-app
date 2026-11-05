import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import type { InvoiceItem, Status } from '@/lib/invoice';
import PageTop from '../../PageTop';
import { invoiceContext } from '../data';
import InvoiceDetail from './InvoiceDetail';

export const metadata = { title: 'Detail invoice · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await invoiceContext();
  const inv = await db.invoice.findFirst({ where: { id, userId } });
  if (!inv) notFound();
  return (
    <>
      <PageTop title="Detail invoice" sub={inv.number} back="/app/invoice" />
      <InvoiceDetail inv={{
        id: inv.id, number: inv.number, customerName: inv.customerName, customerPhone: inv.customerPhone ?? '', orderDate: inv.orderDate,
        note: inv.note ?? '', items: inv.items as unknown as InvoiceItem[], deliveryType: inv.deliveryType, deliveryAddress: inv.deliveryAddress ?? '',
        deliveryFee: inv.deliveryFee, subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, taxPct: inv.taxPct, total: inv.total,
        status: inv.status as Status, payMethod: inv.payMethod ?? '', history: inv.history as unknown as Array<{ s: Status; at: string; m?: string }>
      }} />
    </>
  );
}
