import * as z from 'zod';

// Addresses come from providers as they are: no format check that a real address could fail.
export const mailAddressSchema = z.object({
  /** Display name, empty when the sender gave none. */
  name: z.string(),
  address: z.string().min(1),
});

export type MailAddress = z.infer<typeof mailAddressSchema>;
