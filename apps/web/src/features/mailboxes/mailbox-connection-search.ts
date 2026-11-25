import * as z from 'zod';

// A hand-edited address keeps working: an invalid parameter is dropped, not an error.
const parameterSchema = z.string().min(1).optional().catch(undefined);

/** What a provider sends the browser back with: a state and a code, or why there is no code. */
export const mailboxConnectionSearchSchema = z.object({
  state: parameterSchema,
  code: parameterSchema,
  /** The reason of the provider when the user did not grant the access, such as `access_denied`. */
  error: parameterSchema,
});
