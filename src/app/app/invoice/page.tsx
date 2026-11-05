import Link from 'next/link';
import Icon from '@/components/Icon';
import { db } from '@/lib/db';
import type { InvoiceItem, Status } from '@/lib/invoice';
import PageTop from '../PageTop';
import { invoiceContext } from './data';
import InvoiceList, { type Row } from './InvoiceList';

export const metadata = { title: 'Invoice · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const { userId, outletId, shop } = await invoiceContext();
  // Invoices of the store being viewed (older ones made before stores existed show everywhere).
  const list = await db.invoice.findMany({ where: { userId, OR: [{ applicationId: outletId }, { applicationId: null }] }, orderBy: { createdAt: 'desc' }, take: 300 });
  const rows: Row[] = list.map((i) => ({
    id: i.id, number: i.number, customerName: i.customerName, customerPhone: i.customerPhone ?? '', total: i.total,
    status: i.status as Status, deliveryType: i.deliveryType, createdAt: i.createdAt.toISOString(), paidAt: i.paidAt?.toISOString() ?? null,
    count: (i.items as unknown as InvoiceItem[]).reduce((s, x) => s + x.qty, 0)
  }));
  return (
    <>
      <PageTop title="Invoice" action={<Link href="/app/invoice/produk" className="top-chip" style={{ opacity: 1, color: '#fff', textDecoration: 'none' }}><Icon name="box" size={16} />Produk</Link>} />
      <InvoiceList rows={rows} qrisActive={shop.qrisActive} />
    </>
  );
}
