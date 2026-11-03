'use server';

import { revalidatePath } from 'next/cache';
import { audit, requireAdmin } from '@/lib/auth';
import { runDbBackup } from '@/lib/backup';

export type BackupState = { error: string | null; name?: string };

export async function backupNow(_prev: BackupState): Promise<BackupState> {
  const admin = await requireAdmin(['ADMIN']);
  try {
    const name = await runDbBackup();
    await audit(admin.id, 'BACKUP_RUN', undefined, name);
    revalidatePath('/admin/cadangan');
    return { error: null, name };
  } catch (e) {
    console.error('[backup] manual run failed', e);
    return { error: 'Cadangan gagal dibuat. Cek log container app.' };
  }
}
