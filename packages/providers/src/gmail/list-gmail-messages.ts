import type { ProviderMessagePage } from '@mailbox/shared';
import * as z from 'zod';
import { askGmail, askGmailIfThere } from './ask-gmail.ts';

/**
 * A page is what the copy of a mailbox reads in one go, at the pace Gmail allows: about a minute
 * of work, which a stopped server loses at most.
 */
const PAGE_SIZE = 100;
/** Gmail leaves spam and the bin out of a listing by itself; drafts take a search. */
const WITHOUT_DRAFTS = '-in:draft';
/** How Gmail refuses a page token it no longer knows. */
const INVALID_ARGUMENT = 400;

const gmailMessageListSchema = z.object({
  /** Absent when the mailbox, or the page, holds no message. */
  messages: z.array(z.object({ id: z.string().min(1) })).optional(),
  nextPageToken: z.string().min(1).optional(),
});

/**
 * A page of the messages of a Gmail mailbox, most recent first, without spam, bin nor drafts.
 * Null when Gmail no longer knows the page asked for.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function listGmailMessages(
  accessToken: string,
  pageToken: string | null,
): Promise<ProviderMessagePage | null> {
  const query = new URLSearchParams({ maxResults: String(PAGE_SIZE), q: WITHOUT_DRAFTS });
  if (pageToken !== null) {
    query.set('pageToken', pageToken);
  }
  const path = `/messages?${query}`;
  // Without a page token, a request Gmail calls invalid is a fault of this code, not a lost page.
  const list =
    pageToken === null
      ? await askGmail(accessToken, path, gmailMessageListSchema)
      : await askGmailIfThere(accessToken, path, gmailMessageListSchema, INVALID_ARGUMENT);
  return (
    list && {
      providerMessageIds: (list.messages ?? []).map((message) => message.id),
      nextPageToken: list.nextPageToken ?? null,
    }
  );
}
