import * as z from 'zod';

// A hand-edited or outdated address keeps working: an invalid parameter is dropped, not an error.
export const mailListSearchSchema = z.object({
  /** Limits the inbox to one mailbox. */
  mailbox: z.string().min(1).optional().catch(undefined),
  /** Shows unread threads only. */
  unread: z.boolean().optional().catch(undefined),
});

export type MailListSearch = z.infer<typeof mailListSearchSchema>;
