import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
};

export function allowedMime(mime: string, allowPdf: boolean) {
  if (mime === 'application/pdf') return allowPdf;
  return mime in EXT;
}

/** Saves a file under UPLOAD_DIR/<applicationId>/ and returns its relative storage path. */
export async function saveUpload(applicationId: string, kind: string, file: File): Promise<string> {
  const ext = EXT[file.type] ?? 'bin';
  const dir = path.join(ROOT, applicationId);
  await mkdir(dir, { recursive: true });
  const name = `${kind.toLowerCase()}-${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return path.join(applicationId, name);
}

export async function readUpload(storagePath: string): Promise<Buffer> {
  const full = path.resolve(ROOT, storagePath);
  if (!full.startsWith(path.resolve(ROOT) + path.sep)) throw new Error('Invalid path');
  return readFile(full);
}
