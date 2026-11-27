import type { ProviderMessagePage } from '@mailbox/shared';
import * as z from 'zod';
import { askGmail } from './ask-gmail.ts';

/** The most Gmail gives at once. Ids are light: a page costs one request whatever its size. */
const PAGE_SIZE = 500;

const gmailMessageListSchema = z.object({
  /** Absent when the mailbox, or the page, holds no message. */
  messages: z.array(z.object({ id: z.string().min(1) })).optional(),
  nextPageToken: z.string().min(1).optional(),
});

/**
 * A page of the messages of a Gmail mailbox, most recent first. Gmail leaves spam and the bin out.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function listGmailMessages(
  accessToken: string,
  pageToken: string | null,
): Promise<ProviderMessagePage> {
  const query = new URLSearchParams({ maxResults: String(PAGE_SIZE) });
  if (pageToken !== null) {
    query.set('pageToken', pageToken);
  }
  const list = await askGmail(accessToken, `/messages?${query}`, gmailMessageListSchema);
  return {
    providerMessageIds: (list.messages ?? []).map((message) => message.id),
    nextPageToken: list.nextPageToken ?? null,
  };
}
