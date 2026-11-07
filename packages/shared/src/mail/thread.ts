import * as z from 'zod';
import { mailAddressSchema } from './mail-address.ts';

export const attachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string(),
  mimeType: z.string(),
  /** Size in bytes. */
  size: z.int().nonnegative(),
});

export const messageSchema = z.object({
  id: z.string().min(1),
  from: mailAddressSchema,
  to: z.array(mailAddressSchema),
  cc: z.array(mailAddressSchema),
  sentAt: z.iso.datetime(),
  bodyText: z.string(),
  attachments: z.array(attachmentSchema),
});

export const threadSchema = z.object({
  id: z.string().min(1),
  mailboxId: z.string().min(1),
  subject: z.string(),
  /** Oldest first. */
  messages: z.array(messageSchema).min(1),
});

export type Attachment = z.infer<typeof attachmentSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Thread = z.infer<typeof threadSchema>;
