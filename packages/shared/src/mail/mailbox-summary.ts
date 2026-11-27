import * as z from 'zod';
import { mailProviderNameSchema } from './mail-provider.ts';
import { paletteColorSchema } from './palette-color.ts';

const mailboxStatusSchema = z.enum(['connected', 'reconnectRequired']);

/** Why a mailbox has not been read for a while. */
const syncInterruptionReasonSchema = z.enum([
  /** The provider does not answer. */
  'providerUnavailable',
  /** The server has no client for the provider any more. */
  'providerNotConfigured',
  /** Another error, which the logs of the worker tell. */
  'unexpected',
]);

/** How the mail of a mailbox is kept in line with its provider. */
const mailboxSyncSchema = z.discriminatedUnion('state', [
  z.object({
    /** The whole mailbox is being copied: its mails show as they are copied. */
    state: z.literal('copying'),
    /** The mails copied so far. */
    copiedCount: z.int().nonnegative(),
    /** How many mails the provider announced; null until the copy asked it. */
    totalCount: z.int().nonnegative().nullable(),
  }),
  z.object({
    /** Every mail is copied, and what changes is read every minute. */
    state: z.literal('upToDate'),
    /** When the mailbox was last read; null until it is read once more. */
    checkedAt: z.iso.datetime().nullable(),
  }),
  z.object({
    /** The mailbox has not been read for a while. */
    state: z.literal('interrupted'),
    /** When reading it started to fail. */
    since: z.iso.datetime(),
    reason: syncInterruptionReasonSchema,
  }),
]);

export const mailboxSummarySchema = z.object({
  id: z.string().min(1),
  provider: mailProviderNameSchema,
  /** Name the user gave the mailbox, such as "Perso". */
  name: z.string().min(1),
  address: z.string().min(1),
  color: paletteColorSchema,
  /** Unread threads in the mailbox's inbox. */
  unreadCount: z.int().nonnegative(),
  status: mailboxStatusSchema,
  sync: mailboxSyncSchema,
});

export const mailboxListSchema = z.object({
  mailboxes: z.array(mailboxSummarySchema),
});

export type MailboxSummary = z.infer<typeof mailboxSummarySchema>;
export type MailboxSync = z.infer<typeof mailboxSyncSchema>;
export type MailboxList = z.infer<typeof mailboxListSchema>;
