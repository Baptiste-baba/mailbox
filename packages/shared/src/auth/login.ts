import * as z from 'zod';
import {
  groupedCodeSchema,
  passwordSchema,
  totpCodeSchema,
  usernameSchema,
} from './credentials.ts';

export const secondFactorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('totp'), code: totpCodeSchema }),
  z.object({ kind: z.literal('recoveryCode'), code: groupedCodeSchema }),
]);

/**
 * Sign-in in one request, sent twice: without a second factor the api checks the password and
 * answers SECOND_FACTOR_REQUIRED, then the same request with the code signs in, answering no
 * content but the session cookie.
 */
export const loginRequestSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  secondFactor: secondFactorSchema.optional(),
});

export type SecondFactor = z.infer<typeof secondFactorSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
