import type { ProviderMailboxState } from '@mailbox/shared';
import * as z from 'zod';
import { askGmail } from './ask-gmail.ts';

const gmailProfileSchema = z.object({
  /** The id of the latest change of the mailbox: Gmail numbers every change. */
  historyId: z.string().regex(/^\d{1,20}$/),
  /** Measured: the mails of the mailbox, spam and the bin left out. */
  messagesTotal: z.int().nonnegative(),
});

/**
 * Where a Gmail mailbox stands now: its history, asking for which gives what changes from now on,
 * and how many mails it holds.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function readGmailState(accessToken: string): Promise<ProviderMailboxState> {
  const profile = await askGmail(accessToken, '/profile', gmailProfileSchema);
  return { cursor: profile.historyId, messageCount: profile.messagesTotal };
}
