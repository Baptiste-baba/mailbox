import { mailbox } from '@mailbox/db';
import { and, eq, isNotNull } from 'drizzle-orm';
import { openMailboxAccess } from './open-mailbox-access.ts';
import { refreshMessage } from './refresh-message.ts';
import { storeFolders } from './store-folders.ts';
import type { SyncContext } from './sync-context.ts';

/**
 * Starts the copy of the whole mailbox over: the provider no longer tells what changed since the
 * mailbox was last read, so every mail is read again, and those it no longer has are removed.
 */
async function startCopyOver(context: SyncContext, mailboxId: string): Promise<void> {
  await context.database
    .update(mailbox)
    .set({
      syncCursor: null,
      initialSyncStartedAt: new Date(),
      initialSyncPageToken: null,
      initialSyncCompletedAt: null,
    })
    .where(eq(mailbox.id, mailboxId));
  context.logger.warn({ mailboxId }, 'Changes of the mailbox lost: copying it again');
}

/**
 * Brings a mailbox in line with what changed at its provider since it was last read: new mails,
 * mails read or unread, archived, filed, deleted. Each changed mail is read again; where the
 * reading stands is remembered once all are stored, so that a run that fails is simply done again.
 * There is nothing to do for a mailbox removed, waiting for its user to sign in again, or whose
 * copy has not started.
 * @param signal Stops the run between two mails, when the worker stops.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
 */
export async function syncMailboxChanges(
  context: SyncContext,
  mailboxId: string,
  signal: AbortSignal,
): Promise<void> {
  const startedAt = Date.now();
  const [stored] = await context.database
    .select()
    .from(mailbox)
    .where(
      and(
        eq(mailbox.id, mailboxId),
        eq(mailbox.status, 'connected'),
        isNotNull(mailbox.syncCursor),
      ),
    );
  const access = stored && (await openMailboxAccess(context, stored));
  if (stored?.syncCursor == null || access === undefined) {
    return;
  }
  const changes = await access.provider.listChanges(access.accessToken, stored.syncCursor);
  if (changes === null) {
    await startCopyOver(context, mailboxId);
    return;
  }
  if (changes.providerMessageIds.length > 0) {
    const folders = await access.provider.listFolders(access.accessToken);
    await storeFolders(context.database, mailboxId, folders);
  }
  for (const providerMessageId of changes.providerMessageIds) {
    await refreshMessage(context, access, { mailboxId, providerMessageId }, signal);
  }
  await context.database
    .update(mailbox)
    .set({ syncCursor: changes.nextCursor })
    .where(eq(mailbox.id, mailboxId));
  if (changes.providerMessageIds.length > 0) {
    context.logger.info(
      { mailboxId, changed: changes.providerMessageIds.length, durationMs: Date.now() - startedAt },
      'Mailbox changes stored',
    );
  }
}
