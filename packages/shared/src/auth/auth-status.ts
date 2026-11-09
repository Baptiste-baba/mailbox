import * as z from 'zod';

export const authStatusSchema = z.discriminatedUnion('state', [
  /** No account yet: the setup code from the server logs creates it. */
  z.object({ state: z.literal('setupRequired') }),
  z.object({ state: z.literal('signedOut') }),
  z.object({ state: z.literal('signedIn'), username: z.string() }),
  /**
   * Signed in with a recovery code: the authenticator app is presumed lost, and nothing but its
   * replacement is open to this session until a new one is set up.
   */
  z.object({
    state: z.literal('authenticatorReplacementRequired'),
    recoveryCodesLeft: z.int().nonnegative(),
  }),
]);

export type AuthStatus = z.infer<typeof authStatusSchema>;
