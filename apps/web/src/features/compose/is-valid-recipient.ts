import * as z from 'zod';

const addressSchema = z.email();

/** The address between angle brackets that ends a recipient written with its name. */
const NAMED_ADDRESS = /<([^<>]*)>\s*$/;

/**
 * Whether a recipient as typed or pasted is a mail address: alone, "camille@exemple.fr", or after
 * a name, "Camille Roussel <camille@exemple.fr>", as mail programs copy it.
 */
export function isValidRecipient(recipient: string): boolean {
  const address = NAMED_ADDRESS.exec(recipient)?.[1] ?? recipient;
  return addressSchema.safeParse(address.trim()).success;
}
