import * as z from 'zod';

// Compose hands over a variable left unset as an empty text: the same as no variable.
const optionalTextSchema = z
  .string()
  .optional()
  .transform((text) => (text === '' ? undefined : text));

/**
 * The variables of the OAuth client of the installation at Google, for the schema of the
 * environment of a service. Unset, no Gmail mailbox can be connected nor read.
 */
export const googleClientVariables = {
  GOOGLE_CLIENT_ID: optionalTextSchema,
  GOOGLE_CLIENT_SECRET: optionalTextSchema,
};

const googleClientSchema = z.object(googleClientVariables);

type GoogleClientEnvironment = z.output<typeof googleClientSchema>;

/** Whether both variables are set, or neither: half a client cannot work. */
export function isWholeGoogleClient(environment: GoogleClientEnvironment): boolean {
  return (
    (environment.GOOGLE_CLIENT_ID === undefined) ===
    (environment.GOOGLE_CLIENT_SECRET === undefined)
  );
}

/** What a service says of half a client, when it refuses to start. */
export const HALF_GOOGLE_CLIENT_ISSUE = {
  message: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET together, or neither',
  path: ['GOOGLE_CLIENT_SECRET'],
};

/** The client the variables describe; undefined when they are not set. */
export function googleClientOf(environment: GoogleClientEnvironment) {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = environment;
  return clientId === undefined || clientSecret === undefined
    ? undefined
    : { clientId, clientSecret };
}
