import { type Database, mailbox, notifyMailboxChange } from '@mailbox/db';
import { AppError } from '@mailbox/shared';
import { eq, sql } from 'drizzle-orm';

type FailureReason = NonNullable<(typeof mailbox.$inferSelect)['syncFailureReason']>;

/** What a run that read its mailbox at the provider without failing writes on the mailbox. */
export function syncSucceeded() {
  return { lastSyncedAt: new Date(), syncFailingSince: null, syncFailureReason: null };
}

function failureReasonOf(error: unknown): FailureReason {
  if (error instanceof AppError && error.code === 'MAIL_PROVIDER_UNAVAILABLE') {
    return 'provider_unavailable';
  }
  if (error instanceof AppError && error.code === 'MAIL_PROVIDER_NOT_CONFIGURED') {
    return 'provider_not_configured';
  }
  return 'unexpected';
}

/**
 * Records that a run of a mailbox failed, and why: the time of the first failure since the last
 * success is kept, so that the app can tell how long the mailbox has not been read.
 */
export async function recordSyncFailure(
  database: Database,
  mailboxId: string,
  error: unknown,
): Promise<void> {
  await database
    .update(mailbox)
    .set({
      syncFailingSince: sql`coalesce(${mailbox.syncFailingSince}, now())`,
      syncFailureReason: failureReasonOf(error),
    })
    .where(eq(mailbox.id, mailboxId));
  await notifyMailboxChange(database, mailboxId);
}
