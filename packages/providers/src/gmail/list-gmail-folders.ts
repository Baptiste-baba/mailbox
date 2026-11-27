import type { ProviderFolder } from '@mailbox/shared';
import * as z from 'zod';
import { askGmail } from './ask-gmail.ts';

const gmailLabelListSchema = z.object({
  /** Gmail calls `system` its own labels, such as the inbox, and `user` those the user created. */
  labels: z.array(z.object({ id: z.string().min(1), name: z.string(), type: z.string() })),
});

/**
 * The labels the user created in a Gmail mailbox. One nested in another is named with its
 * parents, as Gmail does: "Parent/Child".
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function listGmailFolders(accessToken: string): Promise<ProviderFolder[]> {
  const list = await askGmail(accessToken, '/labels', gmailLabelListSchema);
  return list.labels
    .filter((label) => label.type === 'user')
    .map((label) => ({ providerFolderId: label.id, name: label.name }));
}
