import { withoutQueryValues } from '@mailbox/db';
import { type Job, PgBoss } from 'pg-boss';
import type { Logger } from 'pino';

// A handful of connections covers polling, maintenance and the few jobs running at once.
const MAX_CONNECTIONS = 3;
const CONNECTION_TIMEOUT_MS = 5_000;

export function createJobQueue(databaseUrl: string, logger: Logger): PgBoss {
  const jobQueue = new PgBoss({
    connectionString: databaseUrl,
    max: MAX_CONNECTIONS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  // pg-boss recovers from these by itself; without a listener, an 'error' event would crash the process.
  jobQueue.on('error', (error) => logger.error({ err: error }, 'Job queue error'));
  jobQueue.on('warning', (warning) => logger.warn({ warning }, 'Job queue warning'));
  return jobQueue;
}

export async function isDatabaseReachable(jobQueue: PgBoss, logger: Logger): Promise<boolean> {
  try {
    await jobQueue.getDb().executeSql('select 1');
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Database unreachable');
    return false;
  }
}

/**
 * Has `handler` work the jobs of a queue, one at a time. The queue keeps the error of a failed job
 * in its table: it is handed back without the values of a failed query, which may be the content
 * of a mail.
 */
export async function workJobs(
  jobQueue: PgBoss,
  queue: string,
  handler: (job: Job<unknown>) => Promise<void>,
): Promise<void> {
  await jobQueue.work(queue, async (jobs) => {
    for (const job of jobs) {
      try {
        await handler(job);
      } catch (error) {
        throw withoutQueryValues(error);
      }
    }
  });
}
