import type { ProviderMessage } from '@mailbox/shared';
import { askGmailIfThere } from './ask-gmail.ts';
import { isUnmirroredLabel } from './gmail-labels.ts';
import { gmailMessageSchema } from './gmail-message-schema.ts';
import { toProviderMessage } from './to-provider-message.ts';

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
  const mirrored = message !== null && !message.labelIds?.some(isUnmirroredLabel);
  return mirrored ? toProviderMessage(message) : null;
}
