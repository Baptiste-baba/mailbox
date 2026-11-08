import * as z from 'zod';
import { groupedCodeSchema, newPasswordSchema, usernameSchema } from './credentials.ts';
import { totpConfirmationSchema } from './totp-enrollment.ts';

export const RECOVERY_CODE_COUNT = 10;

/** Asks for the secret of the authenticator app; the username names the entry in that app. */
export const setupEnrollmentRequestSchema = z.object({
  setupCode: groupedCodeSchema,
  username: usernameSchema,
});

export const setupRequestSchema = setupEnrollmentRequestSchema.extend({
  ...totpConfirmationSchema.shape,
  password: newPasswordSchema,
});

/** Shown once, right after setup: the codes that let the user in without the authenticator app. */
export const setupResponseSchema = z.object({
  recoveryCodes: z.array(z.string()).length(RECOVERY_CODE_COUNT),
});

export type SetupEnrollmentRequest = z.infer<typeof setupEnrollmentRequestSchema>;
export type SetupRequest = z.infer<typeof setupRequestSchema>;
export type SetupResponse = z.infer<typeof setupResponseSchema>;
