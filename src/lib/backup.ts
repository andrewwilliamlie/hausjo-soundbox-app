import { spawn } from 'node:child_process';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

// Database dumps live on the uploads volume (it survives container updates), in a folder the file route never serves.
export const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
export const BACKUP_DIR = path.join(UPLOAD_ROOT, '.backups');
const KEEP = 14;
const NAME = /^hausjo-db-\d{8}-\d{4}\.dump$/;

export type BackupFile = { name: string; size: number; at: Date };

export async function listBackups(): Promise<BackupFile[]> {
  await mkdir(BACKUP_DIR, { recursive: true });
  const names = (await readdir(BACKUP_DIR)).filter((n) => NAME.test(n));
  const files = await Promise.all(names.map(async (name) => {
    const s = await stat(path.join(BACKUP_DIR, name));
    return { name, size: s.size, at: s.mtime };
  }));
  return files.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function backupPath(name: string) {
  if (!NAME.test(name)) return null;
  return path.join(BACKUP_DIR, name);
}

function stamp(d = new Date()) {
  // Jakarta time, e.g. 20261103-0200
  const j = new Date(d.getTime() + 7 * 3600_000).toISOString();
  return j.slice(0, 10).replace(/-/g, '') + '-' + j.slice(11, 16).replace(':', '');
}

let running: Promise<string> | null = null;

/** pg_dump of the whole database (custom format, compressed); keeps the newest 14. */
export function runDbBackup(): Promise<string> {
  if (running) return running;
  running = (async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    await mkdir(BACKUP_DIR, { recursive: true });
    const name = `hausjo-db-${stamp()}.dump`;
    const file = path.join(BACKUP_DIR, name);
    await new Promise<void>((resolve, reject) => {
      const p = spawn('pg_dump', ['--format=custom', '--no-owner', '--file', file, '--dbname', url], { stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      p.stderr.on('data', (c) => { err += c; });
      p.on('error', reject);
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exited ${code}: ${err.slice(0, 300)}`))));
    }).catch(async (e) => { await unlink(file).catch(() => {}); throw e; });
    const all = await listBackups();
    await Promise.all(all.slice(KEEP).map((f) => unlink(path.join(BACKUP_DIR, f.name)).catch(() => {})));
    console.log('[backup] database saved', name);
    return name;
  })().finally(() => { running = null; });
  return running;
}

/** Starts the daily schedule: a dump around 02:00 WIB, plus one shortly after start-up if the newest is over a day old. */
export function startBackupSchedule() {
  const g = globalThis as unknown as { __hjBackup?: boolean };
  if (g.__hjBackup) return;
  g.__hjBackup = true;
  const tick = async () => {
    try {
      const latest = (await listBackups())[0];
      const age = latest ? Date.now() - latest.at.getTime() : Infinity;
      const hourWib = new Date(Date.now() + 7 * 3600_000).getUTCHours();
      if (age > 26 * 3600_000 || (hourWib === 2 && age > 3 * 3600_000)) await runDbBackup();
    } catch (e) {
      console.error('[backup] failed', e);
    }
  };
  setTimeout(tick, 2 * 60_000);
  setInterval(tick, 15 * 60_000);
}
