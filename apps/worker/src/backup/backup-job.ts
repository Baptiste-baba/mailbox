import { basename } from 'node:path';
import type { Job, PgBoss } from 'pg-boss';
import type { Logger } from 'pino';
import { pruneBackups } from './backup-files.ts';
import { dumpDatabase } from './dump-database.ts';

export const BACKUP_QUEUE = 'database-backup';

const EVERY_NIGHT_AT_3 = '0 3 * * *';
const BACKUPS_TO_KEEP = 7;

export interface BackupTarget {
  databaseUrl: string;
  directory: string;
}

export async function registerBackupJob(
  jobQueue: PgBoss,
  target: BackupTarget,
  logger: Logger,
): Promise<void> {
  await jobQueue.createQueue(BACKUP_QUEUE, {
    // Never two backups at once, and never a pile of them waiting after an outage.
    policy: 'exclusive',
    // A large mailbox takes minutes to dump on the NAS; past two hours, pg_dump is stopped.
    expireInSeconds: 2 * 60 * 60,
    retryLimit: 3,
    retryDelay: 10 * 60,
    retryBackoff: true,
  });
  // 3 a.m. on the machine's clock (TZ variable); a night missed while it was off runs once on restart.
  await jobQueue.schedule(BACKUP_QUEUE, EVERY_NIGHT_AT_3, null, {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    missed: 'once',
  });
  await jobQueue.work(BACKUP_QUEUE, async (jobs) => {
    for (const job of jobs) {
      await runBackup(target, job, logger);
    }
  });
}

async function runBackup(target: BackupTarget, job: Job<unknown>, logger: Logger): Promise<void> {
  const startedAt = Date.now();
  try {
    const path = await dumpDatabase(target.databaseUrl, target.directory, job.signal);
    const deletedCount = await pruneBackups(target.directory, BACKUPS_TO_KEEP);
    const durationMs = Date.now() - startedAt;
    logger.info(
      { jobId: job.id, file: basename(path), durationMs, deletedCount },
      'Database backup completed',
    );
  } catch (error) {
    logger.error(
      { err: error, jobId: job.id, retryCount: job.retryCount },
      'Database backup failed',
    );
    throw error;
  }
}
