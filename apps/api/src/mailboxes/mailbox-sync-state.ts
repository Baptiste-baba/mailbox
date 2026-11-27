import type { mailbox } from '@mailbox/db';
import type { MailboxSync } from '@mailbox/shared';

/**
 * How long a mailbox fails to be read before the app says so. A failure or two now and then, such
 * as Google not answering for a minute, is no news: the next run reads the mailbox again.
 */
export const SYNC_INTERRUPTION_DELAY_MS = 10 * 60 * 1000;

type StoredMailbox = typeof mailbox.$inferSelect;

type StoredSync = Pick<
  StoredMailbox,
  | 'initialSyncCompletedAt'
  | 'initialSyncTotal'
  | 'lastSyncedAt'
  | 'syncFailingSince'
  | 'syncFailureReason'
> & {
  /** The mails the copy under way stored so far. */
  copiedCount: number;
};

type StoredReason = NonNullable<StoredMailbox['syncFailureReason']>;

function toReason(stored: StoredReason): Extract<MailboxSync, { state: 'interrupted' }>['reason'] {
  switch (stored) {
    case 'provider_unavailable':
      return 'providerUnavailable';
    case 'provider_not_configured':
      return 'providerNotConfigured';
    case 'unexpected':
      return 'unexpected';
  }
}

/** How the synchronisation of a mailbox goes, as the app shows it. */
export function toMailboxSync(stored: StoredSync, now: Date): MailboxSync {
  const failingSince = stored.syncFailingSince;
  if (
    failingSince !== null &&
    now.getTime() - failingSince.getTime() >= SYNC_INTERRUPTION_DELAY_MS
  ) {
    const reason = toReason(stored.syncFailureReason ?? 'unexpected');
    return { state: 'interrupted', since: failingSince.toISOString(), reason };
  }
  if (stored.initialSyncCompletedAt === null) {
    const { copiedCount, initialSyncTotal: totalCount } = stored;
    return { state: 'copying', copiedCount, totalCount };
  }
  return { state: 'upToDate', checkedAt: stored.lastSyncedAt?.toISOString() ?? null };
}
