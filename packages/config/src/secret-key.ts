import * as z from 'zod';

const SECRET_KEY_LENGTH = 32;

/** The key that encrypts the secrets kept in the database, given in base64. */
export const secretKeySchema = z
  .base64()
  .transform((key) => Buffer.from(key, 'base64'))
  .refine((key) => key.length === SECRET_KEY_LENGTH, {
    message: 'Must be 32 bytes in base64: generate one with openssl rand -base64 32',
  });
