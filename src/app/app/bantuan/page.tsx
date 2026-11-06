import { requireMerchant } from '@/lib/auth';
import { db } from '@/lib/db';
import { HELP_STATUS_LABEL, topicById, type HelpStatus } from '@/lib/help';
import PageTop from '../PageTop';
import HelpHome from './HelpHome';

export const metadata = { title: 'Bantuan · AIPOS' };
export const dynamic = 'force-dynamic';

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { user } = await requireMerchant();
  const { k } = await searchParams;
  const reqs = await db.helpRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 });
  const recent = reqs.map((r) => ({
    number: r.number, topic: topicById(r.topic)?.title ?? r.topic, topicId: r.topic,
    status: HELP_STATUS_LABEL[r.status as HelpStatus] ?? r.status, open: r.status === 'OPEN',
    at: r.createdAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
  }));
  return (
    <>
      <PageTop title="Bantuan" sub="Panduan cepat & CS AIPOS" />
      <HelpHome initialCat={k ?? ''} recent={recent} />
    </>
  );
}
