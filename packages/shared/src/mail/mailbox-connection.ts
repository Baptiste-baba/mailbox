import * as z from 'zod';
import { mailProviderNameSchema } from './mail-provider.ts';
import { paletteColorSchema } from './palette-color.ts';

const MAILBOX_NAME_MAX_LENGTH = 40;

export const mailboxIdSchema = z.uuid();

/** Adding a mailbox: what the user chose before signing in at the provider. */
export const mailboxConnectionRequestSchema = z.object({
  provider: mailProviderNameSchema,
  /** Name the user gives the mailbox, such as "Perso": short enough for the sidebar. */
  name: z.string().trim().min(1).max(MAILBOX_NAME_MAX_LENGTH),
  color: paletteColorSchema,
});

/** Where the browser goes next, for the user to sign in at the provider. */
export const mailboxAuthorizationSchema = z.object({
  authorizationUrl: z.url(),
});

// Bounded: both come from the address the provider sent the browser back to.
const STATE_MAX_LENGTH = 200;
const CODE_MAX_LENGTH = 2_000;

/** What the provider sent the browser back with, once the user signed in there. */
export const mailboxConnectionCompletionSchema = z.object({
  state: z.string().min(1).max(STATE_MAX_LENGTH),
  code: z.string().min(1).max(CODE_MAX_LENGTH),
});

export type MailboxConnectionRequest = z.infer<typeof mailboxConnectionRequestSchema>;
export type MailboxAuthorization = z.infer<typeof mailboxAuthorizationSchema>;
export type MailboxConnectionCompletion = z.infer<typeof mailboxConnectionCompletionSchema>;
