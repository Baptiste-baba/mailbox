import { mailbox } from '@mailbox/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { Job, PgBoss } from 'pg-boss';
import * as z from 'zod';
import { copyMailboxPage } from './copy-mailbox-page.ts';
import type { SyncContext } from './sync-context.ts';

/** One job copies one page of a mailbox, then queues the next. */
export const MAILBOX_COPY_QUEUE = 'mailbox-copy';
/** Every minute, looks for mailboxes whose copy has no job: just connected, or left by a failure. */
const MAILBOX_WATCH_QUEUE = 'mailbox-copy-watch';
const EVERY_MINUTE = '* * * * *';

const copyJobSchema = z.object({ mailboxId: z.uuid() });

/** Queues the copy of a mailbox. One with a job already waiting is not queued twice. */
async function queueCopy(jobQueue: PgBoss, mailboxId: string): Promise<void> {
  await jobQueue.send(MAILBOX_COPY_QUEUE, { mailboxId }, { singletonKey: mailboxId });
}

async function queueUnfinishedCopies(jobQueue: PgBoss, context: SyncContext): Promise<void> {
  const unfinished = await context.database
    .select({ id: mailbox.id })
    .from(mailbox)
    .where(and(eq(mailbox.status, 'connected'), isNull(mailbox.initialSyncCompletedAt)));
  for (const { id } of unfinished) {
    await queueCopy(jobQueue, id);
  }
}

async function runCopy(jobQueue: PgBoss, context: SyncContext, job: Job<unknown>): Promise<void> {
  const { mailboxId } = copyJobSchema.parse(job.data);
  try {
    const outcome = await copyMailboxPage(context, mailboxId, job.signal);
    if (outcome === 'more') {
      await queueCopy(jobQueue, mailboxId);
    }
  } catch (error) {
    context.logger.error(
      { err: error, jobId: job.id, mailboxId, retryCount: job.retryCount },
      'Mailbox page copy failed',
    );
    throw error;
  }
}

/**
 * Has the worker copy the mail of every connected mailbox, page after page, in the background.
 * A page that fails is tried again; a copy left without a job is picked up within a minute.
 */
export async function registerMailboxCopyJobs(
  jobQueue: PgBoss,
  context: SyncContext,
): Promise<void> {
  await jobQueue.createQueue(MAILBOX_COPY_QUEUE, {
    // Per mailbox: one page being copied, and at most the next one waiting.
    policy: 'stately',
    // A page takes about a minute; a job left by a worker that died is given up after ten.
    expireInSeconds: 10 * 60,
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
  });
  await jobQueue.createQueue(MAILBOX_WATCH_QUEUE, { policy: 'exclusive' });
  await jobQueue.schedule(MAILBOX_WATCH_QUEUE, EVERY_MINUTE);
  await jobQueue.work(MAILBOX_COPY_QUEUE, async (jobs) => {
    for (const job of jobs) {
      await runCopy(jobQueue, context, job);
    }
  });
  await jobQueue.work(MAILBOX_WATCH_QUEUE, () => queueUnfinishedCopies(jobQueue, context));
  // At start, without waiting for the minute to turn.
  await queueUnfinishedCopies(jobQueue, context);
}
