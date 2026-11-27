import { mailbox } from '@mailbox/db';
import { requireMailProvider } from '@mailbox/providers';
import { AppError, type MailProvider, type MailProviderName } from '@mailbox/shared';
import { eq } from 'drizzle-orm';
import type { SyncContext } from './sync-context.ts';

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

/**
 * An access to read a mailbox at its provider. None when the provider no longer accepts what was
 * kept of the sign-in, or when that cannot be read any more: the mailbox is marked as waiting for
 * its user to sign in again, and the other mailboxes go on.
 * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function openMailboxAccess(
  context: SyncContext,
  stored: StoredAccess,
): Promise<MailboxAccess | undefined> {
  const provider = requireMailProvider(context.providers, stored.provider);
  const refreshToken = openRefreshToken(context, stored);
  const access =
    refreshToken === undefined
      ? undefined
      : await provider.renewAccess(refreshToken).catch((error: unknown) => {
          if (error instanceof AppError && error.code === 'MAILBOX_RECONNECTION_REQUIRED') {
            return undefined;
          }
          throw error;
        });
  if (access === undefined) {
    await context.database
      .update(mailbox)
      .set({ status: 'reconnect_required' })
      .where(eq(mailbox.id, stored.id));
    context.logger.warn({ mailboxId: stored.id }, 'Mailbox waiting for its user to sign in again');
    return undefined;
  }
  return { provider, accessToken: access.accessToken };
}
