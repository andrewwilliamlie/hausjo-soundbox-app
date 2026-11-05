import { db } from '@/lib/db';
import InvoiceEditor from '../InvoiceEditor';
import { invoiceContext } from '../data';

export const metadata = { title: 'Buat invoice · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const { userId } = await invoiceContext();
  const products = await db.invoiceProduct.findMany({ where: { userId }, orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } });
  return <InvoiceEditor products={products} />;
}
