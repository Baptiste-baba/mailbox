import * as z from 'zod';

export const usernameSchema = z.string().trim().min(1).max(64);

/** The password chosen at setup: long enough to resist guessing, bounded to keep hashing cheap. */
export const newPasswordSchema = z.string().min(12).max(256);

/** A password typed to sign in: its length says nothing, the hash comparison decides. */
export const passwordSchema = z.string().min(1).max(256);

/** The secret of an authenticator app as the server issues it: 160 bits in base32. */
export const totpSecretSchema = z.string().regex(/^[A-Z2-7]{32}$/);

/** A code of the authenticator app. */
export const totpCodeSchema = z.string().regex(/^\d{6}$/);

/** A single-use code, or the setup code: three groups of four letters and digits, any case. */
export const groupedCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{4}$/);
