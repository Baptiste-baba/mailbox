import { mailbox, message } from '@mailbox/db';
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

async function rememberProgress(
  context: SyncContext,
  mailboxId: string,
  nextPageToken: string | null,
  completed: boolean,
): Promise<void> {
  await context.database
    .update(mailbox)
    .set({
      initialSyncPageToken: nextPageToken,
      initialSyncCompletedAt: completed ? new Date() : null,
    })
    .where(eq(mailbox.id, mailboxId));
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
    await rememberProgress(context, mailboxId, null, false);
    return 'more';
  }
  let stored = 0;
  for (const providerMessageId of await unseenMessageIds(
    context,
    copied,
    page.providerMessageIds,
  )) {
    stored += Number(
      await refreshMessage(context, access, { mailboxId, providerMessageId }, signal),
    );
  }
  const completed = page.nextPageToken === null;
  if (completed) {
    await removeMessagesNotFound(context, copied);
  }
  await rememberProgress(context, mailboxId, page.nextPageToken, completed);
  context.logger.info(
    {
      mailboxId,
      listed: page.providerMessageIds.length,
      stored,
      completed,
      durationMs: Date.now() - startedAt,
    },
    'Mailbox page copied',
  );
  return completed ? 'done' : 'more';
}
