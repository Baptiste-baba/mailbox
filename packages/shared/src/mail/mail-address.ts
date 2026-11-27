import * as z from 'zod';

// Addresses come from providers as they are: no format check that a real address could fail.
export const mailAddressSchema = z.object({
  /** Display name, empty when the sender gave none. */
  name: z.string(),
  /** Empty for the sender of a mail that names none the app could read. */
  address: z.string(),
});

export type MailAddress = z.infer<typeof mailAddressSchema>;
