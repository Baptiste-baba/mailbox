import * as z from 'zod';
import { paletteColorSchema } from './palette-color.ts';

const mailboxStatusSchema = z.enum(['connected', 'reconnectRequired']);

const mailboxSummarySchema = z.object({
  id: z.string().min(1),
  /** Name the user gave the mailbox, such as "Perso". */
  name: z.string().min(1),
  address: z.string().min(1),
  color: paletteColorSchema,
  /** Unread threads in the mailbox's inbox. */
  unreadCount: z.int().nonnegative(),
  status: mailboxStatusSchema,
});

export const mailboxListSchema = z.object({
  mailboxes: z.array(mailboxSummarySchema),
});

export type MailboxSummary = z.infer<typeof mailboxSummarySchema>;
export type MailboxList = z.infer<typeof mailboxListSchema>;
