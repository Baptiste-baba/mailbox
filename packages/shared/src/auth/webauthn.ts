import * as z from 'zod';

// The JSON forms of WebAuthn that the browser's parse*FromJSON() and toJSON() exchange with the api.
// Binary values travel in base64url, bounded; fields the app never reads are dropped.

/** A credential id is at most 1,023 bytes. */
const credentialIdSchema = z.base64url().min(1).max(1_364);
/** A user handle is at most 64 bytes. */
const userHandleSchema = z.base64url().min(1).max(86);
/** Client data, authenticator data, attestation, signature or challenge. */
const binarySchema = z.base64url().min(1).max(16_384);

const credentialDescriptorSchema = z.object({
  id: credentialIdSchema,
  type: z.literal('public-key'),
});

/**
 * What the browser needs to sign in, or to confirm the identity, with a passkey. No list of
 * passkeys: the user picks one of those their password manager keeps for the app.
 */
export const passkeyRequestOptionsSchema = z.object({
  challenge: binarySchema,
  rpId: z.string().min(1),
  timeout: z.int().positive(),
  userVerification: z.literal('required'),
});

/** What the browser needs to create a passkey for the account. */
export const passkeyCreationOptionsSchema = z.object({
  challenge: binarySchema,
  rp: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  user: z.object({ id: userHandleSchema, name: z.string().min(1), displayName: z.string() }),
  pubKeyCredParams: z.array(z.object({ type: z.literal('public-key'), alg: z.int() })).min(1),
  timeout: z.int().positive(),
  /** The passkeys the account already has: a password manager must not replace one of them. */
  excludeCredentials: z.array(credentialDescriptorSchema),
  authenticatorSelection: z.object({
    residentKey: z.literal('required'),
    userVerification: z.literal('required'),
  }),
  attestation: z.literal('none'),
});

/** A passkey just created, as the browser hands it over. */
export const passkeyRegistrationResponseSchema = z.object({
  id: credentialIdSchema,
  rawId: credentialIdSchema,
  type: z.literal('public-key'),
  response: z.object({ clientDataJSON: binarySchema, attestationObject: binarySchema }),
  clientExtensionResults: z.object({}),
});

/** A passkey's signature over a challenge of the api, naming the account it belongs to. */
export const passkeyAuthenticationResponseSchema = z.object({
  id: credentialIdSchema,
  rawId: credentialIdSchema,
  type: z.literal('public-key'),
  response: z.object({
    clientDataJSON: binarySchema,
    authenticatorData: binarySchema,
    signature: binarySchema,
    userHandle: userHandleSchema,
  }),
  clientExtensionResults: z.object({}),
});

export type PasskeyRequestOptions = z.infer<typeof passkeyRequestOptionsSchema>;
export type PasskeyCreationOptions = z.infer<typeof passkeyCreationOptionsSchema>;
export type PasskeyAuthenticationResponse = z.infer<typeof passkeyAuthenticationResponseSchema>;
