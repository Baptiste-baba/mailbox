import { mailbox } from '@mailbox/db';
import type { ProviderChanges } from '@mailbox/shared';
import { and, eq, isNotNull } from 'drizzle-orm';
import { type MailboxAccess, openMailboxAccess } from './open-mailbox-access.ts';
import { refreshMessage } from './refresh-message.ts';
import { removeMessage } from './remove-message.ts';
import { storeFolders } from './store-folders.ts';
import type { SyncContext } from './sync-context.ts';
import { syncSucceeded } from './sync-health.ts';

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
 * Removes the mails the mirror no longer holds, without asking the provider, then reads again
 * those that changed, at the pace the provider allows.
 */
async function applyChanges(
  context: SyncContext,
  access: MailboxAccess,
  mailboxId: string,
  changes: ProviderChanges,
  signal: AbortSignal,
): Promise<void> {
  for (const providerMessageId of changes.goneMessageIds) {
    await removeMessage(context.database, mailboxId, providerMessageId);
  }
  if (changes.changedMessageIds.length === 0) {
    return;
  }
  const folders = await access.provider.listFolders(access.accessToken);
  await storeFolders(context.database, mailboxId, folders);
  for (const providerMessageId of changes.changedMessageIds) {
    await refreshMessage(context, access, { mailboxId, providerMessageId }, signal);
  }
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
  await applyChanges(context, access, mailboxId, changes, signal);
  await context.database
    .update(mailbox)
    .set({ syncCursor: changes.nextCursor, ...syncSucceeded() })
    .where(eq(mailbox.id, mailboxId));
  const { changedMessageIds: changed, goneMessageIds: gone } = changes;
  if (changed.length + gone.length > 0) {
    context.logger.info(
      { mailboxId, changed: changed.length, gone: gone.length, durationMs: Date.now() - startedAt },
      'Mailbox changes stored',
    );
  }
}
