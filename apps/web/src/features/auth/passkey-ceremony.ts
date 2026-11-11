import {
  type PasskeyAuthenticationResponse,
  type PasskeyRequestOptions,
  passkeyAuthenticationResponseSchema,
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
