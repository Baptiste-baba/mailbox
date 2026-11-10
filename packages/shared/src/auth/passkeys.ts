import * as z from 'zod';
import { passkeyNameSchema } from './credentials.ts';
import {
  passkeyAuthenticationResponseSchema,
  passkeyRegistrationResponseSchema,
} from './webauthn.ts';

const passkeySummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  /** Null until the passkey first signs in or confirms the identity. */
  lastUsedAt: z.iso.datetime().nullable(),
});

/** The passkeys of the account, oldest first. Their keys never leave the api. */
export const passkeyListSchema = z.object({ passkeys: z.array(passkeySummarySchema) });

/** Adding a passkey: the name the user gives it, and the passkey the browser created. */
export const passkeyRegistrationSchema = z.object({
  name: passkeyNameSchema,
  response: passkeyRegistrationResponseSchema,
});

/** Signing in with a passkey alone: it names the account, and it is two factors in one. */
export const passkeyLoginRequestSchema = z.object({
  response: passkeyAuthenticationResponseSchema,
});

export type PasskeySummary = z.infer<typeof passkeySummarySchema>;
export type PasskeyList = z.infer<typeof passkeyListSchema>;
export type PasskeyRegistration = z.infer<typeof passkeyRegistrationSchema>;
export type PasskeyLoginRequest = z.infer<typeof passkeyLoginRequestSchema>;
