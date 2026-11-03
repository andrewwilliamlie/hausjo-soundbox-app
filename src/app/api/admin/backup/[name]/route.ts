import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { adminId, audit } from '@/lib/auth';
import { db } from '@/lib/db';
import { backupPath, UPLOAD_ROOT } from '@/lib/backup';

export const dynamic = 'force-dynamic';

// ADMIN only. /api/admin/backup/<dump name> downloads a database dump; /api/admin/backup/foto streams all uploads as .tar.gz.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const aid = await adminId();
  const admin = aid ? await db.admin.findUnique({ where: { id: aid } }) : null;
  if (!admin || admin.role !== 'ADMIN') return new NextResponse('Forbidden', { status: 403 });
  const { name } = await params;
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };

  if (name === 'foto') {
    const entries = (await readdir(UPLOAD_ROOT).catch(() => [] as string[])).filter((e) => e !== '.backups');
    if (!entries.length) return new NextResponse('Belum ada foto', { status: 404 });
    await audit(admin.id, 'BACKUP_DOWNLOAD', undefined, 'foto');
    const tar = spawn('tar', ['-czf', '-', '-C', UPLOAD_ROOT, ...entries], { stdio: ['ignore', 'pipe', 'ignore'] });
    const day = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
    return new NextResponse(Readable.toWeb(tar.stdout) as ReadableStream, {
      headers: { ...headers, 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="hausjo-foto-${day}.tar.gz"` }
    });
  }

  const file = backupPath(name);
  const s = file ? await stat(file).catch(() => null) : null;
  if (!file || !s) return new NextResponse('Not found', { status: 404 });
  await audit(admin.id, 'BACKUP_DOWNLOAD', undefined, name);
  return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: { ...headers, 'Content-Type': 'application/octet-stream', 'Content-Length': String(s.size), 'Content-Disposition': `attachment; filename="${name}"` }
  });
}
