import type { PasskeyCreationOptions, PasskeyRequestOptions } from '@mailbox/shared';
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

/**
 * The options a passkey is created from, as the api gives them to the page under test; the ids of
 * `existing` passkeys are those no password manager may replace.
 */
export function testPasskeyCreationOptions(existing: string[] = []): PasskeyCreationOptions {
  return {
    challenge: 'Y3JlYXRpb24tY2hhbGxlbmdlLWZvci10ZXN0cw',
    rp: { id: window.location.hostname, name: 'MailBox' },
    user: { id: 'dXNlci1oYW5kbGUtb2YtYWxleA', name: 'alex', displayName: 'alex' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    timeout: 60_000,
    excludeCredentials: existing.map((id) => ({ id, type: 'public-key' })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    attestation: 'none',
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
    publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(testPasskeyCreationOptions()),
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

/**
 * The browser waiting for the user to pick a passkey among the suggestions of a field, who never
 * does: only the signal of the request ends it.
 */
export function waitForeverForPick(request?: CredentialRequestOptions): Promise<Credential | null> {
  return new Promise((_resolve, reject) => {
    request?.signal?.addEventListener('abort', () => reject(request.signal?.reason));
  });
}
