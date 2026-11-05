import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stickerContext } from '../data';
import OrderWizard from '../OrderWizard';

export const metadata = { title: 'Pesan stiker · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function NewStickerOrderPage() {
  const { user, app, active } = await stickerContext();
  if (!active) redirect('/app/stiker');
  const rows = await db.shipAddress.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
  const saved = rows.map((a) => ({
    id: a.id, label: a.label, recipient: a.recipient, phone: a.phone, address: a.address, province: a.province, city: a.city,
    kecamatan: a.kecamatan, kelurahan: a.kelurahan, postalCode: a.postalCode, villageCode: a.villageCode ?? '', courierNote: a.courierNote ?? ''
  }));
  // A new address starts from the store's own address.
  const street = [app.street, app.number, app.rt || app.rw ? `RT ${app.rt ?? '-'}/RW ${app.rw ?? '-'}` : ''].filter(Boolean).join(' ');
  const blank = {
    label: 'Toko', recipient: app.ktpName ?? '', phone: user.phone, address: [app.businessName, street].filter(Boolean).join(', '),
    province: app.province ?? '', city: app.city ?? '', kecamatan: app.kecamatan ?? '', kelurahan: app.kelurahan ?? '',
    postalCode: app.postalCode ?? '', villageCode: app.villageCode ?? '', courierNote: ''
  };
  const area = [app.kelurahan, app.kecamatan].filter(Boolean).join(', ');
  return <OrderWizard store={{ name: app.businessName ?? 'Toko', area }} saved={saved} blank={blank} />;
}
