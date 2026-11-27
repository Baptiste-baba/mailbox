import type { ProviderMessage } from '@mailbox/shared';
import { askGmailIfThere } from './ask-gmail.ts';
import { gmailMessageSchema } from './gmail-message-schema.ts';
import { toProviderMessage } from './to-provider-message.ts';

/** The labels under which Gmail keeps what is not mirrored: spam, the bin and drafts. */
const UNMIRRORED_LABELS = new Set(['SPAM', 'TRASH', 'DRAFT']);

/**
 * A message of a Gmail mailbox, bodies included; null when Gmail no longer has it, or holds it as
 * spam, in the bin or as a draft.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function readGmailMessage(
  accessToken: string,
  providerMessageId: string,
): Promise<ProviderMessage | null> {
  const path = `/messages/${encodeURIComponent(providerMessageId)}?format=full`;
  const message = await askGmailIfThere(accessToken, path, gmailMessageSchema);
  const mirrored =
    message !== null && !message.labelIds?.some((labelId) => UNMIRRORED_LABELS.has(labelId));
  return mirrored ? toProviderMessage(message) : null;
}
