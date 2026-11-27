import type { ProviderChanges } from '@mailbox/shared';
import * as z from 'zod';
import { askGmailIfThere } from './ask-gmail.ts';
import { gmailHistoryRecordSchema, sortGmailChanges } from './sort-gmail-changes.ts';

/**
 * As many changes as a mailbox can be read mails in about a minute: a changed mail is read again,
 * at the pace Gmail allows.
 */
const PAGE_SIZE = 100;

const gmailHistorySchema = z.object({
  /** Absent when nothing changed. Records come oldest first. */
  history: z.array(gmailHistoryRecordSchema).optional(),
  nextPageToken: z.string().optional(),
  /** Where the history of the mailbox stands now. */
  historyId: z.string().regex(/^\d{1,20}$/),
});

/**
 * What changed in a Gmail mailbox since a point of its history, a page of records at a time: the
 * messages to read again, and those the mirror no longer holds. Null when Gmail no longer keeps
 * the history since that point (HTTP 404, measured: it keeps about a week of it).
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function listGmailChanges(
  accessToken: string,
  cursor: string,
): Promise<ProviderChanges | null> {
  const query = new URLSearchParams({ startHistoryId: cursor, maxResults: String(PAGE_SIZE) });
  const page = await askGmailIfThere(accessToken, `/history?${query}`, gmailHistorySchema);
  if (page === null) {
    return null;
  }
  const records = page.history ?? [];
  // More records follow: they are asked for from the last one read, not with the page token, so
  // that a cursor alone always tells where the reading stands.
  const lastRead = page.nextPageToken === undefined ? undefined : records.at(-1)?.id;
  return { ...sortGmailChanges(records), nextCursor: lastRead ?? page.historyId };
}
