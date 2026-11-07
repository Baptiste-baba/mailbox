import * as z from 'zod';
import { mailAddressSchema } from './mail-address.ts';

/** One line of a mail list: what is needed to show a thread without opening it. */
export const threadSummarySchema = z.object({
  id: z.string().min(1),
  mailboxId: z.string().min(1),
  subject: z.string(),
  /** Sender of the latest message. */
  sender: mailAddressSchema,
  /** Start of the latest message, as plain text. */
  snippet: z.string(),
  lastMessageAt: z.iso.datetime(),
  unread: z.boolean(),
  messageCount: z.int().positive(),
  hasAttachments: z.boolean(),
});

export const threadPageSchema = z.object({
  threads: z.array(threadSummarySchema),
  /** Passed back to get the next page; null on the last one. */
  nextCursor: z.string().nullable(),
});

export type ThreadSummary = z.infer<typeof threadSummarySchema>;
export type ThreadPage = z.infer<typeof threadPageSchema>;
