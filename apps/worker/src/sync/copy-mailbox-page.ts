import { setTimeout as wait } from 'node:timers/promises';
import { mailbox, message } from '@mailbox/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type MailboxAccess, openMailboxAccess } from './open-mailbox-access.ts';
import { storeFolders } from './store-folders.ts';
import { storeMessage } from './store-message.ts';
import type { SyncContext } from './sync-context.ts';

/** Whether pages of the mailbox remain to copy. */
export type CopyOutcome = 'more' | 'done';

/** The mails of a page not stored yet: a page read again after a failure skips the others. */
async function missingMessageIds(
  context: SyncContext,
  mailboxId: string,
  providerMessageIds: string[],
): Promise<string[]> {
  if (providerMessageIds.length === 0) {
    return [];
  }
  const stored = await context.database
    .select({ providerMessageId: message.providerMessageId })
    .from(message)
    .where(
      and(eq(message.mailboxId, mailboxId), inArray(message.providerMessageId, providerMessageIds)),
    );
  const known = new Set(stored.map((row) => row.providerMessageId));
  return providerMessageIds.filter((providerMessageId) => !known.has(providerMessageId));
}

/** Reads and stores mails one at a time, no faster than the provider lets a mailbox be read. */
async function copyMessages(
  context: SyncContext,
  access: MailboxAccess,
  mailboxId: string,
  providerMessageIds: string[],
  signal: AbortSignal,
): Promise<number> {
  let copied = 0;
  let nextReadAt = 0;
  for (const providerMessageId of providerMessageIds) {
    await wait(Math.max(0, nextReadAt - Date.now()), undefined, { signal });
    nextReadAt = Date.now() + context.readIntervalMs;
    const mail = await access.provider.readMessage(access.accessToken, providerMessageId);
    // Deleted since it was listed: there is nothing left to copy.
    if (mail !== null) {
      await storeMessage(context.database, mailboxId, mail);
      copied += 1;
    }
  }
  return copied;
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

/**
 * Copies the next page of the mails a mailbox held when it was connected, most recent first, and
 * remembers where the copy stands. There is nothing to copy for a mailbox removed, copied already
 * or waiting for its user to sign in again.
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
  const [stored] = await context.database
    .select()
    .from(mailbox)
    .where(
      and(
        eq(mailbox.id, mailboxId),
        eq(mailbox.status, 'connected'),
        isNull(mailbox.initialSyncCompletedAt),
      ),
    );
  const access = stored && (await openMailboxAccess(context, stored));
  if (stored === undefined || access === undefined) {
    return 'done';
  }
  await storeFolders(
    context.database,
    mailboxId,
    await access.provider.listFolders(access.accessToken),
  );
  const page = await access.provider.listMessages(access.accessToken, stored.initialSyncPageToken);
  if (page === null) {
    // The provider lost the page: the listing starts again, and skips what is stored.
    await rememberProgress(context, mailboxId, null, false);
    return 'more';
  }
  const missing = await missingMessageIds(context, mailboxId, page.providerMessageIds);
  const copied = await copyMessages(context, access, mailboxId, missing, signal);
  const completed = page.nextPageToken === null;
  await rememberProgress(context, mailboxId, page.nextPageToken, completed);
  context.logger.info(
    {
      mailboxId,
      listed: page.providerMessageIds.length,
      copied,
      completed,
      durationMs: Date.now() - startedAt,
    },
    'Mailbox page copied',
  );
  return completed ? 'done' : 'more';
}
