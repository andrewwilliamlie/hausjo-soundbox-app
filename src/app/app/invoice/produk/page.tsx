import { db } from '@/lib/db';
import PageTop from '../../PageTop';
import { invoiceContext } from '../data';
import ProductsClient from './ProductsClient';

export const metadata = { title: 'Produk · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { userId, shop } = await invoiceContext();
  const products = await db.invoiceProduct.findMany({ where: { userId }, orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } });
  return (
    <>
      <PageTop title="Produk & pengaturan" sub="Untuk invoice" back="/app/invoice" />
      <ProductsClient products={products} code={shop.code} />
    </>
  );
}
