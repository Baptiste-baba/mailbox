import * as z from 'zod';

/** What Google answers when it accepts a code. Fields the app has no use for are left out. */
export const googleTokenGrantSchema = z.object({
  access_token: z.string().min(1),
  /** Absent when Google grants no lasting access. */
  refresh_token: z.string().min(1).optional(),
  /** The permissions actually granted, separated by spaces. */
  scope: z.string(),
});

/** What Google answers when it renews an access. Fields the app has no use for are left out. */
export const googleAccessRenewalSchema = z.object({
  access_token: z.string().min(1),
  /** How long the access holds, in seconds. */
  expires_in: z.number().positive(),
});

/** What Google answers when it refuses a request for a token (RFC 6749, section 5.2). */
export const googleTokenRefusalSchema = z.object({
  error: z.string().regex(/^[a-z_]{1,40}$/),
  /** A short sentence of Google about the refusal, such as "Malformed auth code.". */
  error_description: z.string().optional(),
});
