import * as z from 'zod';

export const threadViewSchema = z.enum([
  /** Threads in the inbox of every mailbox, or of one mailbox. */
  'inbox',
  /** Every thread of every mailbox, archived ones included. */
  'all',
]);

const THREAD_PAGE_MAX_SIZE = 100;

// Query string values arrive as text: booleans and numbers are parsed from it.
export const threadListQuerySchema = z.object({
  view: threadViewSchema,
  mailboxId: z.string().min(1).optional(),
  unreadOnly: z.stringbool().default(false),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(THREAD_PAGE_MAX_SIZE).default(50),
});

export type ThreadView = z.infer<typeof threadViewSchema>;
export type ThreadListQuery = z.infer<typeof threadListQuerySchema>;
