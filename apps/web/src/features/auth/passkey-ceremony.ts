import {
  type PasskeyAuthenticationResponse,
  type PasskeyCreationOptions,
  type PasskeyRegistrationResponse,
  type PasskeyRequestOptions,
  passkeyAuthenticationResponseSchema,
  passkeyRegistrationResponseSchema,
} from '@mailbox/shared';

/** Whether this browser takes and gives passkeys in the JSON forms of WebAuthn the api speaks. */
export function passkeysSupported(): boolean {
  return (
    typeof PublicKeyCredential !== 'undefined' &&
    typeof PublicKeyCredential.parseRequestOptionsFromJSON === 'function'
  );
}

/**
 * Asks the browser for a passkey of the app, which signs the challenge of `options` once the user
 * unlocks it. With the `conditional` mediation, the browser waits for the user to pick one among
 * the suggestions of a field, until `signal` stops it.
 * @throws DOMException NotAllowedError when the user closes the browser's window, among others;
 * the reason of `signal` once it aborts.
 */
export async function getPasskey(
  options: PasskeyRequestOptions,
  request: Pick<CredentialRequestOptions, 'mediation' | 'signal'> = {},
): Promise<PasskeyAuthenticationResponse> {
  const credential = await navigator.credentials.get({
    ...request,
    publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options),
  });
  // The browser answers what it was asked for: anything else would be its bug.
  if (!(credential instanceof PublicKeyCredential)) {
    throw new DOMException('No passkey given', 'NotAllowedError');
  }
  return passkeyAuthenticationResponseSchema.parse(credential.toJSON());
}

/**
 * Asks the browser to create a passkey of the app, kept by the password manager the user picks.
 * @throws DOMException NotAllowedError when the user closes the browser's window, among others;
 * InvalidStateError when that password manager already keeps one of the account's passkeys.
 */
export async function createPasskey(
  options: PasskeyCreationOptions,
): Promise<PasskeyRegistrationResponse> {
  const credential = await navigator.credentials.create({
    publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options),
  });
  // The browser answers what it was asked for: anything else would be its bug.
  if (!(credential instanceof PublicKeyCredential)) {
    throw new DOMException('No passkey created', 'NotAllowedError');
  }
  return passkeyRegistrationResponseSchema.parse(credential.toJSON());
}
