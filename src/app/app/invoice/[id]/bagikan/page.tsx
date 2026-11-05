import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import type { InvoiceItem, Status } from '@/lib/invoice';
import PageTop from '../../../PageTop';
import { invoiceContext } from '../../data';
import ShareClient from './ShareClient';

export const metadata = { title: 'Bagikan invoice · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function SharePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string; ubah?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { userId, shop } = await invoiceContext();
  const inv = await db.invoice.findFirst({ where: { id, userId } });
  if (!inv) notFound();
  return (
    <>
      <PageTop title="Bagikan invoice" sub={inv.number} back={`/app/invoice/${inv.id}`} />
      <ShareClient
        just={sp.baru ? 'new' : sp.ubah ? 'edit' : ''}
        id={inv.id}
        shop={{ name: shop.name, phone: shop.phone, address: shop.address, nmid: shop.nmid }}
        qrisUrl={shop.qrisActive && shop.stickerIsImage ? `/api/files/${shop.stickerId}` : null}
        inv={{
          number: inv.number, createdAt: inv.createdAt.toISOString(), customerName: inv.customerName, customerPhone: inv.customerPhone ?? '',
          orderDate: inv.orderDate, note: inv.note ?? '', items: inv.items as unknown as InvoiceItem[], deliveryType: inv.deliveryType,
          deliveryAddress: inv.deliveryAddress ?? '', deliveryFee: inv.deliveryFee, subtotal: inv.subtotal, discount: inv.discount,
          tax: inv.tax, taxPct: inv.taxPct, total: inv.total, status: inv.status as Status, payMethod: inv.payMethod ?? ''
        }}
      />
    </>
  );
}
