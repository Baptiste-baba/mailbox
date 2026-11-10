import * as z from 'zod';
import { passwordSchema, totpCodeSchema } from './credentials.ts';
import { passkeyAuthenticationResponseSchema } from './webauthn.ts';

/**
 * Proving again who one is before changing how one signs in: with a passkey, or with the password
 * and a code of the authenticator app.
 */
export const identityConfirmationSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('passkey'), response: passkeyAuthenticationResponseSchema }),
  z.object({ method: z.literal('password'), password: passwordSchema, totpCode: totpCodeSchema }),
]);

export type IdentityConfirmation = z.infer<typeof identityConfirmationSchema>;
