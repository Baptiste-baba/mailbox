import type { Logger } from 'pino';
import { registerBackupJob } from './backup/backup-job.ts';
import type { WorkerConfig } from './config/worker-config.ts';
import { startHealthServer } from './health/health-server.ts';
import { createJobQueue, isDatabaseReachable } from './job-queue.ts';

// Lets a running backup finish; Docker's stop grace period must stay above it.
const SHUTDOWN_TIMEOUT_MS = 30_000;

export interface RunningWorker {
  healthPort: number;
  stop: () => Promise<void>;
}

export async function startWorker(config: WorkerConfig, logger: Logger): Promise<RunningWorker> {
  const jobQueue = createJobQueue(config.databaseUrl, logger);
  await jobQueue.start();
  try {
    const backupTarget = { databaseUrl: config.databaseUrl, directory: config.backupDirectory };
    await registerBackupJob(jobQueue, backupTarget, logger);
    const healthServer = await startHealthServer(config.healthPort, () =>
      isDatabaseReachable(jobQueue, logger),
    );
    return {
      healthPort: healthServer.port,
      stop: async () => {
        await healthServer.close();
        await jobQueue.stop({ graceful: true, timeout: SHUTDOWN_TIMEOUT_MS });
      },
    };
  } catch (error) {
    await jobQueue.stop({ graceful: false });
    throw error;
  }
}
