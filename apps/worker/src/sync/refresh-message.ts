import type { MailboxAccess } from './open-mailbox-access.ts';
import { removeMessage } from './remove-message.ts';
import { storeMessage } from './store-message.ts';
import type { SyncContext } from './sync-context.ts';

/**
 * Brings what is stored of a mail in line with its provider, read at the pace the provider
 * allows: the mail is stored as it is now, or removed when the provider no longer has it or holds
 * it as spam, deleted mail or a draft. The provider is the source of truth.
 * @returns Whether the mail is stored after that.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function refreshMessage(
  context: SyncContext,
  access: MailboxAccess,
  mail: { mailboxId: string; providerMessageId: string },
  signal: AbortSignal,
): Promise<boolean> {
  await context.pace.waitForTurn(mail.mailboxId, signal);
  const read = await access.provider.readMessage(access.accessToken, mail.providerMessageId);
  if (read === null) {
    await removeMessage(context.database, mail.mailboxId, mail.providerMessageId);
    return false;
  }
  await storeMessage(context.database, mail.mailboxId, read);
  return true;
}
