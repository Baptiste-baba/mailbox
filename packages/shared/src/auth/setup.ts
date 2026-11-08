import * as z from 'zod';
import { groupedCodeSchema, newPasswordSchema, usernameSchema } from './credentials.ts';
import { totpConfirmationSchema } from './totp-enrollment.ts';

export const RECOVERY_CODE_COUNT = 10;

export const setupCodeRequestSchema = z.object({ setupCode: groupedCodeSchema });

export const setupRequestSchema = totpConfirmationSchema.extend({
  setupCode: groupedCodeSchema,
  username: usernameSchema,
  password: newPasswordSchema,
});

/** Shown once, right after setup: the codes that let the user in without the authenticator app. */
export const setupResponseSchema = z.object({
  recoveryCodes: z.array(z.string()).length(RECOVERY_CODE_COUNT),
});

export type SetupCodeRequest = z.infer<typeof setupCodeRequestSchema>;
export type SetupRequest = z.infer<typeof setupRequestSchema>;
export type SetupResponse = z.infer<typeof setupResponseSchema>;
