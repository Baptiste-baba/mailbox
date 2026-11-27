import { mailbox, message } from '@mailbox/db';
import type { ProviderMessagePage } from '@mailbox/shared';
import { and, eq, gte, inArray, isNull, lt } from 'drizzle-orm';
import { type MailboxAccess, openMailboxAccess } from './open-mailbox-access.ts';
import { refreshMessage } from './refresh-message.ts';
import { removeMessage } from './remove-message.ts';
import { storeFolders } from './store-folders.ts';
import type { SyncContext } from './sync-context.ts';

/** Whether pages of the mailbox remain to copy. */
export type CopyOutcome = 'more' | 'done';

/** A mailbox being copied, as stored. */
type CopiedMailbox = typeof mailbox.$inferSelect;

/**
 * The mails of a page this copy has not stored yet: a page read again after a failure skips the
 * others. A mail stored before the copy started is read again: it may have changed since.
 */
async function unseenMessageIds(
  context: SyncContext,
  copied: CopiedMailbox,
  providerMessageIds: string[],
): Promise<string[]> {
  if (providerMessageIds.length === 0) {
    return [];
  }
  const seen = await context.database
    .select({ providerMessageId: message.providerMessageId })
    .from(message)
    .where(
      and(
        eq(message.mailboxId, copied.id),
        inArray(message.providerMessageId, providerMessageIds),
        gte(message.syncedAt, copied.initialSyncStartedAt),
      ),
    );
  const seenIds = new Set(seen.map((row) => row.providerMessageId));
  return providerMessageIds.filter((providerMessageId) => !seenIds.has(providerMessageId));
}

/**
 * What tells what changes in the mailbox from before its first page is listed: nothing that
 * happens during the copy is lost. Asked once per copy, however many times its pages are retried.
 */
async function rememberStartingCursor(
  context: SyncContext,
  access: MailboxAccess,
  copied: CopiedMailbox,
): Promise<void> {
  if (copied.syncCursor !== null) {
    return;
  }
  const syncCursor = await access.provider.currentCursor(access.accessToken);
  await context.database.update(mailbox).set({ syncCursor }).where(eq(mailbox.id, copied.id));
}

/** Removes the mails the copy did not find at the provider: gone since they were stored. */
async function removeMessagesNotFound(context: SyncContext, copied: CopiedMailbox): Promise<void> {
  const gone = await context.database
    .select({ providerMessageId: message.providerMessageId })
    .from(message)
    .where(
      and(eq(message.mailboxId, copied.id), lt(message.syncedAt, copied.initialSyncStartedAt)),
    );
  for (const { providerMessageId } of gone) {
    await removeMessage(context.database, copied.id, providerMessageId);
  }
}

/**
 * The mailbox, while the copy a page belongs to is still the one under way. Reading changes may
 * start the copy over meanwhile, which moves its start later: the progress of the page is then no
 * longer the copy's to write. Postgres keeps microseconds where a Date keeps milliseconds: a start
 * within the millisecond of the one loaded is that very start.
 */
function underSameCopy(copied: CopiedMailbox) {
  const loadedStart = copied.initialSyncStartedAt.getTime();
  return and(
    eq(mailbox.id, copied.id),
    lt(mailbox.initialSyncStartedAt, new Date(loadedStart + 1)),
  );
}

/** @returns Whether the progress was written: false when the copy was started over meanwhile. */
async function rememberProgress(
  context: SyncContext,
  copied: CopiedMailbox,
  nextPageToken: string | null,
  completed: boolean,
): Promise<boolean> {
  const written = await context.database
    .update(mailbox)
    .set({
      initialSyncPageToken: nextPageToken,
      initialSyncCompletedAt: completed ? new Date() : null,
    })
    .where(underSameCopy(copied))
    .returning({ id: mailbox.id });
  return written.length > 0;
}

/** Reads and stores the mails of a page this copy has not stored yet: how many are stored. */
async function copyListedMessages(
  context: SyncContext,
  access: MailboxAccess,
  copied: CopiedMailbox,
  page: ProviderMessagePage,
  signal: AbortSignal,
): Promise<number> {
  let stored = 0;
  for (const providerMessageId of await unseenMessageIds(
    context,
    copied,
    page.providerMessageIds,
  )) {
    const mail = { mailboxId: copied.id, providerMessageId };
    stored += Number(await refreshMessage(context, access, mail, signal));
  }
  return stored;
}

async function findMailboxToCopy(
  context: SyncContext,
  mailboxId: string,
): Promise<CopiedMailbox | undefined> {
  const [copied] = await context.database
    .select()
    .from(mailbox)
    .where(
      and(
        eq(mailbox.id, mailboxId),
        eq(mailbox.status, 'connected'),
        isNull(mailbox.initialSyncCompletedAt),
      ),
    );
  return copied;
}

/**
 * Copies the next page of the mails of a mailbox, most recent first, and remembers where the copy
 * stands. After the last page, the mails stored that the copy did not find are removed. There is
 * nothing to copy for a mailbox removed, copied already or waiting for its user to sign in again.
 * @param signal Stops the copy between two mails, when the worker stops.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE The page is copied again later: mails already stored
 * are not read twice.
 * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
 */
export async function copyMailboxPage(
  context: SyncContext,
  mailboxId: string,
  signal: AbortSignal,
): Promise<CopyOutcome> {
  const startedAt = Date.now();
  const copied = await findMailboxToCopy(context, mailboxId);
  const access = copied && (await openMailboxAccess(context, copied));
  if (copied === undefined || access === undefined) {
    return 'done';
  }
  await rememberStartingCursor(context, access, copied);
  const folders = await access.provider.listFolders(access.accessToken);
  await storeFolders(context.database, mailboxId, folders);
  const page = await access.provider.listMessages(access.accessToken, copied.initialSyncPageToken);
  if (page === null) {
    // The provider lost the page: the listing starts again, and skips what this copy stored.
    await rememberProgress(context, copied, null, false);
    return 'more';
  }
  const stored = await copyListedMessages(context, access, copied, page, signal);
  const lastPage = page.nextPageToken === null;
  if (lastPage) {
    // What this copy did not find is gone, whether or not the copy was started over meanwhile.
    await removeMessagesNotFound(context, copied);
  }
  const written = await rememberProgress(context, copied, page.nextPageToken, lastPage);
  context.logger.info(
    {
      mailboxId,
      listed: page.providerMessageIds.length,
      stored,
      startedOver: !written,
      durationMs: Date.now() - startedAt,
    },
    'Mailbox page copied',
  );
  return lastPage && written ? 'done' : 'more';
}
