// ONE-TIME pre-launch cleanup (7 Nov 2026): the owner confirmed no real merchant accounts exist yet.
// Backs up the database, then deletes all merchant data and uploaded files; admin/team logins stay.
// A marker file in the uploads volume stops it from ever running again. Remove this file after it has run.
import { readdir, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { db } from './db';
import { UPLOAD_ROOT, runDbBackup } from './backup';

const MARKER = path.join(UPLOAD_ROOT, '.test-data-cleared');

export async function clearTestDataOnce() {
  if (await access(MARKER).then(() => true, () => false)) return;
  try {
    const backup = await runDbBackup();
    console.log('[reset] backup before clearing test data:', backup);
    const counts = await db.$transaction(async (tx) => {
      const c = {
        audits: (await tx.auditLog.deleteMany({ where: { applicationId: { not: null } } })).count,
        invoices: (await tx.invoice.deleteMany({})).count,
        products: (await tx.invoiceProduct.deleteMany({})).count,
        orders: (await tx.stickerOrder.deleteMany({})).count,
        addresses: (await tx.shipAddress.deleteMany({})).count,
        help: (await tx.helpRequest.deleteMany({})).count,
        resets: (await tx.passwordReset.deleteMany({})).count,
        documents: (await tx.document.deleteMany({})).count,
        stores: (await tx.application.deleteMany({})).count,
        merchants: (await tx.user.deleteMany({})).count
      };
      return c;
    }, { timeout: 60_000 });
    // Uploaded files (KTP, selfies, store photos, QRIS stickers); keep backups and markers.
    let files = 0;
    for (const name of await readdir(UPLOAD_ROOT).catch(() => [] as string[])) {
      if (name.startsWith('.')) continue;
      await rm(path.join(UPLOAD_ROOT, name), { recursive: true, force: true });
      files++;
    }
    await writeFile(MARKER, `cleared ${new Date().toISOString()} backup ${backup}\n`);
    console.log('[reset] test data cleared', JSON.stringify({ ...counts, uploadFolders: files }));
  } catch (e) {
    console.error('[reset] FAILED, nothing marked as done:', e instanceof Error ? e.message : e);
  }
}
