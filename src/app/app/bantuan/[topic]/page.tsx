import { notFound } from 'next/navigation';
import { requireMerchant } from '@/lib/auth';
import { categoryById, topicById } from '@/lib/help';
import PageTop from '../../PageTop';
import TopicGuide from './TopicGuide';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const t = topicById((await params).topic);
  return { title: `${t?.title ?? 'Bantuan'} · AIPOS` };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { user, application } = await requireMerchant();
  const topic = topicById((await params).topic);
  if (!topic) notFound();
  const cat = categoryById(topic.cat);
  return (
    <>
      <PageTop title={topic.title} sub={cat?.title} back={`/app/bantuan?k=${topic.cat}`} />
      <TopicGuide topic={topic} phone={user.phone} store={application?.businessName ?? ''} />
    </>
  );
}
