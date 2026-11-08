import * as z from 'zod';

export const authStatusSchema = z.discriminatedUnion('state', [
  /** No account yet: the setup code from the server logs creates it. */
  z.object({ state: z.literal('setupRequired') }),
  z.object({ state: z.literal('signedOut') }),
  z.object({ state: z.literal('signedIn'), username: z.string() }),
]);

export type AuthStatus = z.infer<typeof authStatusSchema>;
