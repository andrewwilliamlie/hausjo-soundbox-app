import { adminId, audit, merchantId } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Private files: merchants may open their own QRIS sticker; admins may open everything (KTP views are logged).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id }, include: { application: true } });
  if (!doc) return new NextResponse('Not found', { status: 404 });

  const aid = await adminId();
  const uid = aid ? null : await merchantId();
  const ownerAllowed = uid && doc.application.userId === uid && doc.kind === 'QRIS_STICKER';
  if (!aid && !ownerAllowed) return new NextResponse('Forbidden', { status: 403 });

  if (aid && (doc.kind === 'KTP' || doc.kind === 'SELFIE')) await audit(aid, 'VIEW_' + doc.kind, doc.applicationId);

  const body = await readUpload(doc.storagePath);
  const download = new URL(req.url).searchParams.get('download');
  const ext = doc.mime === 'application/pdf' ? 'pdf' : doc.mime.split('/')[1];
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': doc.mime,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(download ? { 'Content-Disposition': `attachment; filename="QRIS-${doc.application.ticket}.${ext}"` } : {})
    }
  });
}
