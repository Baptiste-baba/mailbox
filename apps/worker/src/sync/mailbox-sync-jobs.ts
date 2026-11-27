import { mailbox, withoutQueryValues } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import type { Job, PgBoss } from 'pg-boss';
import * as z from 'zod';
import { copyMailboxPage } from './copy-mailbox-page.ts';
import { forgetMailboxAccess } from './open-mailbox-access.ts';
import type { SyncContext } from './sync-context.ts';
import { syncMailboxChanges } from './sync-mailbox-changes.ts';

/** One job copies one page of a mailbox, then queues the next. */
const MAILBOX_COPY_QUEUE = 'mailbox-copy';
/** One job stores what changed in a mailbox since it was last read. */
const MAILBOX_CHANGES_QUEUE = 'mailbox-changes';
/**
 * Every minute, queues the work of each connected mailbox: reading its changes, and its copy when
 * it has no job, for a mailbox just connected or a copy left by a failure.
 */
const MAILBOX_WATCH_QUEUE = 'mailbox-sync-watch';
const EVERY_MINUTE = '* * * * *';

const mailboxJobSchema = z.object({ mailboxId: z.uuid() });

/** Queues work for a mailbox. One with such a job already waiting is not queued twice. */
async function queueFor(jobQueue: PgBoss, queue: string, mailboxId: string): Promise<void> {
  await jobQueue.send(queue, { mailboxId }, { singletonKey: mailboxId });
}

async function queueMailboxWork(jobQueue: PgBoss, context: SyncContext): Promise<void> {
  const connected = await context.database
    .select({
      id: mailbox.id,
      copiedAt: mailbox.initialSyncCompletedAt,
      syncCursor: mailbox.syncCursor,
    })
    .from(mailbox)
    .where(eq(mailbox.status, 'connected'));
  for (const { id, copiedAt, syncCursor } of connected) {
    if (copiedAt === null) {
      await queueFor(jobQueue, MAILBOX_COPY_QUEUE, id);
    }
    // Without a cursor, the copy has not started: it asks for one before its first page.
    if (syncCursor !== null) {
      await queueFor(jobQueue, MAILBOX_CHANGES_QUEUE, id);
    }
  }
}

/** Runs the work of a job for its mailbox; a failure is logged, then left to the queue. */
async function runFor(
  context: SyncContext,
  job: Job<unknown>,
  work: (mailboxId: string) => Promise<void>,
): Promise<void> {
  const { mailboxId } = mailboxJobSchema.parse(job.data);
  try {
    await work(mailboxId);
  } catch (error) {
    // The access in use may be what failed: the next run asks the provider for a new one.
    forgetMailboxAccess(context, mailboxId);
    context.logger.error(
      { err: error, queue: job.name, jobId: job.id, mailboxId, retryCount: job.retryCount },
      'Mailbox job failed',
    );
    // The queue keeps the error of a failed job in its table: without the mail it may carry.
    throw withoutQueryValues(error);
  }
}

async function createQueues(jobQueue: PgBoss): Promise<void> {
  await jobQueue.createQueue(MAILBOX_COPY_QUEUE, {
    // Per mailbox: one page being copied, and at most the next one waiting.
    policy: 'stately',
    // A page takes about a minute; a job left by a worker that died is given up after ten.
    expireInSeconds: 10 * 60,
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
  });
  await jobQueue.createQueue(MAILBOX_CHANGES_QUEUE, {
    // Per mailbox: one run, queued or under way. A run that fails is done again the next minute.
    policy: 'exclusive',
    expireInSeconds: 10 * 60,
    retryLimit: 0,
  });
  await jobQueue.createQueue(MAILBOX_WATCH_QUEUE, { policy: 'exclusive' });
}

/**
 * Has the worker keep the mail of every connected mailbox in line with its provider, in the
 * background: the copy of the mailbox, page after page, and every minute what changed since.
 */
export async function registerMailboxSyncJobs(
  jobQueue: PgBoss,
  context: SyncContext,
): Promise<void> {
  await createQueues(jobQueue);
  await jobQueue.schedule(MAILBOX_WATCH_QUEUE, EVERY_MINUTE);
  await jobQueue.work(MAILBOX_COPY_QUEUE, async (jobs) => {
    for (const job of jobs) {
      await runFor(context, job, async (mailboxId) => {
        if ((await copyMailboxPage(context, mailboxId, job.signal)) === 'more') {
          await queueFor(jobQueue, MAILBOX_COPY_QUEUE, mailboxId);
        }
      });
    }
  });
  await jobQueue.work(MAILBOX_CHANGES_QUEUE, async (jobs) => {
    for (const job of jobs) {
      await runFor(context, job, (mailboxId) => syncMailboxChanges(context, mailboxId, job.signal));
    }
  });
  await jobQueue.work(MAILBOX_WATCH_QUEUE, () => queueMailboxWork(jobQueue, context));
  // At start, without waiting for the minute to turn.
  await queueMailboxWork(jobQueue, context);
}
