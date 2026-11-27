import { createDatabase, SecretBox } from '@mailbox/db';
import { configuredMailProviders } from '@mailbox/providers';
import type { Logger } from 'pino';
import { registerBackupJob } from './backup/backup-job.ts';
import type { WorkerConfig } from './config/worker-config.ts';
import { startHealthServer } from './health/health-server.ts';
import { createJobQueue, isDatabaseReachable } from './job-queue.ts';
import { registerMailboxSyncJobs } from './sync/mailbox-sync-jobs.ts';
import { ReadPace } from './sync/read-pace.ts';
import type { SyncContext } from './sync/sync-context.ts';

// Lets a running backup finish; Docker's stop grace period must stay above it.
const SHUTDOWN_TIMEOUT_MS = 30_000;
/**
 * Gmail lets a mailbox be read at about a mail and a half a second, measured on a real one: beyond,
 * it refuses requests. Slightly under, a copy goes on without being refused.
 */
const READ_INTERVAL_MS = 750;

export interface RunningWorker {
  healthPort: number;
  stop: () => Promise<void>;
}

export async function startWorker(config: WorkerConfig, logger: Logger): Promise<RunningWorker> {
  const jobQueue = createJobQueue(config.databaseUrl, logger);
  const sync = syncContext(config, logger);
  await jobQueue.start();
  try {
    const backupTarget = { databaseUrl: config.databaseUrl, directory: config.backupDirectory };
    await registerBackupJob(jobQueue, backupTarget, logger);
    await registerMailboxSyncJobs(jobQueue, sync);
    const healthServer = await startHealthServer(config.healthPort, () =>
      isDatabaseReachable(jobQueue, logger),
    );
    return {
      healthPort: healthServer.port,
      stop: async () => {
        await healthServer.close();
        await jobQueue.stop({ graceful: true, timeout: SHUTDOWN_TIMEOUT_MS });
        await sync.database.$client.end();
      },
    };
  } catch (error) {
    await jobQueue.stop({ graceful: false });
    await sync.database.$client.end();
    throw error;
  }
}

function syncContext(config: WorkerConfig, logger: Logger): SyncContext {
  return {
    // The pool discards a connection Postgres closed; the next query opens another.
    database: createDatabase(config.databaseUrl, (error) =>
      logger.warn({ err: error }, 'Idle database connection lost'),
    ),
    providers: configuredMailProviders(config.google),
    secretBox: new SecretBox(config.secretKey),
    logger,
    pace: new ReadPace(READ_INTERVAL_MS),
    accesses: new Map(),
  };
}
