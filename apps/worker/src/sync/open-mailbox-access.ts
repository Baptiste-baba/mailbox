import { mailbox } from '@mailbox/db';
import { requireMailProvider } from '@mailbox/providers';
import { AppError, type MailProvider, type MailProviderName } from '@mailbox/shared';
import { eq } from 'drizzle-orm';
import type { KeptAccess, SyncContext } from './sync-context.ts';

/** An access is renewed while it still holds this long: a run never ends on an expired one. */
const RENEWAL_MARGIN_MS = 10 * 60 * 1000;

interface StoredAccess {
  id: string;
  provider: MailProviderName;
  refreshTokenEncrypted: string;
}

export interface MailboxAccess {
  provider: MailProvider;
  accessToken: string;
}

/** The refresh token of the mailbox; none when the key of the configuration no longer opens it. */
function openRefreshToken(context: SyncContext, stored: StoredAccess): string | undefined {
  try {
    return context.secretBox.open(stored.refreshTokenEncrypted);
  } catch (error) {
    context.logger.warn({ err: error, mailboxId: stored.id }, 'Unreadable refresh token');
    return undefined;
  }
}

/** A new access; none when the provider no longer accepts what was kept of the sign-in. */
async function renewAccess(
  context: SyncContext,
  provider: MailProvider,
  stored: StoredAccess,
): Promise<KeptAccess | undefined> {
  const refreshToken = openRefreshToken(context, stored);
  if (refreshToken === undefined) {
    return undefined;
  }
  try {
    const access = await provider.renewAccess(refreshToken);
    return { refreshTokenEncrypted: stored.refreshTokenEncrypted, ...access };
  } catch (error) {
    if (error instanceof AppError && error.code === 'MAILBOX_RECONNECTION_REQUIRED') {
      return undefined;
    }
    throw error;
  }
}

function stillHolds(kept: KeptAccess | undefined, stored: StoredAccess): kept is KeptAccess {
  return (
    kept !== undefined &&
    kept.refreshTokenEncrypted === stored.refreshTokenEncrypted &&
    kept.expiresAt.getTime() - Date.now() > RENEWAL_MARGIN_MS
  );
}

/**
 * An access to read a mailbox at its provider: the one in use while it holds, else a new one.
 * None when the provider no longer accepts what was kept of the sign-in, or when that cannot be
 * read any more: the mailbox is marked as waiting for its user to sign in again, and the other
 * mailboxes go on.
 * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function openMailboxAccess(
  context: SyncContext,
  stored: StoredAccess,
): Promise<MailboxAccess | undefined> {
  const provider = requireMailProvider(context.providers, stored.provider);
  const kept = context.accesses.get(stored.id);
  const access = stillHolds(kept, stored) ? kept : await renewAccess(context, provider, stored);
  if (access === undefined) {
    context.accesses.delete(stored.id);
    await context.database
      .update(mailbox)
      .set({ status: 'reconnect_required' })
      .where(eq(mailbox.id, stored.id));
    context.logger.warn({ mailboxId: stored.id }, 'Mailbox waiting for its user to sign in again');
    return undefined;
  }
  context.accesses.set(stored.id, access);
  return { provider, accessToken: access.accessToken };
}

/**
 * Forgets the access in use for a mailbox, after a run that failed: the next one asks the
 * provider for a new access, which tells whether the user withdrew it.
 */
export function forgetMailboxAccess(context: SyncContext, mailboxId: string): void {
  context.accesses.delete(mailboxId);
}
