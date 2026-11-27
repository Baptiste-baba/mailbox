import * as z from 'zod';
import { askGmail } from './ask-gmail.ts';

const gmailProfileSchema = z.object({
  /** The id of the latest change of the mailbox: Gmail numbers every change. */
  historyId: z.string().regex(/^\d{1,20}$/),
});

/**
 * Where the history of a Gmail mailbox stands now: asking for the history since then gives what
 * changes from now on.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function readGmailCursor(accessToken: string): Promise<string> {
  const profile = await askGmail(accessToken, '/profile', gmailProfileSchema);
  return profile.historyId;
}
