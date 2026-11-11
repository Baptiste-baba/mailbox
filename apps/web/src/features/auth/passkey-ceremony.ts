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
 * unlocks it.
 * @throws DOMException NotAllowedError when the user closes the browser's window, among others.
 */
export async function getPasskey(
  options: PasskeyRequestOptions,
): Promise<PasskeyAuthenticationResponse> {
  const credential = await navigator.credentials.get({
    publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options),
  });
  // The browser answers what it was asked for: anything else would be its bug.
  if (!(credential instanceof PublicKeyCredential)) {
    throw new DOMException('No passkey given', 'NotAllowedError');
  }
  return passkeyAuthenticationResponseSchema.parse(credential.toJSON());
}
