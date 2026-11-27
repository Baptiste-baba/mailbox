import * as z from 'zod';

/**
 * The HTML body of a message, read apart from its thread when the message is opened: it is by far
 * the heaviest part of a mail. Written by whoever sent the mail: nothing in it can be trusted.
 */
export const messageBodySchema = z.object({
  /** Null for a mail that only has a text body. */
  html: z.string().nullable(),
});

export type MessageBody = z.infer<typeof messageBodySchema>;
