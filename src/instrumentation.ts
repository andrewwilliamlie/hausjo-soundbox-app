// Runs once when the server starts. Only the Node.js runtime starts the backup schedule.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startBackupSchedule } = await import('./lib/backup');
    const { clearTestDataOnce } = await import('./lib/reset-test-data');
    await clearTestDataOnce();
    startBackupSchedule();
  }
}
