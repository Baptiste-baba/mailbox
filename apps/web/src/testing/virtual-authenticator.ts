import type { PasskeyRequestOptions } from '@mailbox/shared';
import { cdp } from 'vitest/browser';

/** The options a passkey sign-in starts from, as the api gives them to the page under test. */
export function testPasskeyRequestOptions(): PasskeyRequestOptions {
  return {
    challenge: 'Y2hhbGxlbmdlLW9mLXRoZS1hcGktZm9yLXRlc3Rz',
    rpId: window.location.hostname,
    timeout: 60_000,
    userVerification: 'required',
  };
}

export interface VirtualAuthenticator {
  /** The id of the passkey it keeps, in base64url. */
  passkeyId: string;
  /** From now on, the user does not manage to unlock the passkey. */
  refuseUnlocking: () => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * Chromium's virtual authenticator, standing for the user's password manager, with one passkey of
 * the app in it, as if added earlier. The passkey unlocks at once, as with Face ID or Touch ID.
 */
export async function addVirtualAuthenticator(): Promise<VirtualAuthenticator> {
  const session = cdp();
  await session.send('WebAuthn.enable');
  const { authenticatorId } = await session.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  const passkey = await navigator.credentials.create({
    publicKey: PublicKeyCredential.parseCreationOptionsFromJSON({
      challenge: 'Y3JlYXRpb24tY2hhbGxlbmdlLWZvci10ZXN0cw',
      rp: { id: window.location.hostname, name: 'MailBox' },
      user: { id: 'dXNlci1oYW5kbGUtb2YtYWxleA', name: 'alex', displayName: 'alex' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    }),
  });
  if (passkey === null) {
    throw new Error('The virtual authenticator created no passkey');
  }
  return {
    passkeyId: passkey.id,
    refuseUnlocking: async () => {
      await session.send('WebAuthn.setUserVerified', { authenticatorId, isUserVerified: false });
    },
    remove: async () => {
      await session.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
    },
  };
}
