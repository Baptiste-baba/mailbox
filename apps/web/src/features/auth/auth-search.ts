import * as z from 'zod';

/**
 * Only a path of this app is a place to go back to: an address such as //example.com would take
 * the user to another site once signed in.
 */
const pathInAppSchema = z
  .string()
  .regex(/^\/(?![/\\])/)
  .optional()
  .catch(undefined);

// A hand-edited address keeps working: an invalid parameter is dropped, not an error.
export const loginSearchSchema = z.object({
  /** Where to go once signed in. */
  redirect: pathInAppSchema,
  /** Why the sign-in is asked again. */
  reason: z.literal('expired').optional().catch(undefined),
});

/** Where to go once the new authenticator app is set up. */
export const authenticatorReplacementSearchSchema = loginSearchSchema.pick({ redirect: true });
