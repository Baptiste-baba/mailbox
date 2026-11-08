import * as z from 'zod';
import { totpCodeSchema, totpSecretSchema } from './credentials.ts';

/** A new secret for the authenticator app, as a QR code (otpauth URI) or as text to type in. */
export const totpEnrollmentSchema = z.object({
  secret: totpSecretSchema,
  otpauthUri: z.string().startsWith('otpauth://totp/'),
});

/** The secret shown to the user and a code from their app, proving the app holds it. */
export const totpConfirmationSchema = z.object({
  totpSecret: totpSecretSchema,
  totpCode: totpCodeSchema,
});

export type TotpEnrollment = z.infer<typeof totpEnrollmentSchema>;
export type TotpConfirmation = z.infer<typeof totpConfirmationSchema>;
