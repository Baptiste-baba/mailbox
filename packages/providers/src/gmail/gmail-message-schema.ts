import * as z from 'zod';

const gmailHeaderSchema = z.object({ name: z.string(), value: z.string() });

/**
 * A part of a Gmail message: the message itself, one of its bodies, a file, or a set of parts.
 * Gmail gives the text of a part as base64url; a file only has the id it is fetched with.
 */
const gmailPartSchema = z.object({
  mimeType: z.string(),
  /** Empty for a part that is no file. */
  filename: z.string().optional(),
  headers: z.array(gmailHeaderSchema).optional(),
  body: z
    .object({
      size: z.number().int().nonnegative(),
      data: z.string().optional(),
      attachmentId: z.string().optional(),
    })
    .optional(),
  get parts() {
    return z.array(gmailPartSchema).optional();
  },
});

export type GmailPart = z.infer<typeof gmailPartSchema>;

/** What Gmail answers for a message asked in full. Fields the app has no use for are left out. */
export const gmailMessageSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  /** Absent when the message has no label at all. */
  labelIds: z.array(z.string()).optional(),
  /** Start of the message, HTML-escaped. */
  snippet: z.string().optional(),
  /** When Gmail received the message, in milliseconds since 1970. */
  internalDate: z.string().regex(/^\d{1,16}$/),
  payload: gmailPartSchema,
});

export type GmailMessage = z.infer<typeof gmailMessageSchema>;
