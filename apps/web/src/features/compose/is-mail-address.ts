import * as z from 'zod';

const addressSchema = z.email();

/** Whether `address` is a mail address on its own, such as "camille@exemple.fr". */
export function isMailAddress(address: string): boolean {
  return addressSchema.safeParse(address).success;
}
