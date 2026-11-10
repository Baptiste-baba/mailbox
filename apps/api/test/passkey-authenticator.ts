import { createHash, generateKeyPairSync, type KeyObject, randomBytes, sign } from 'node:crypto';
import type { PasskeyAuthenticationResponse } from '@mailbox/shared';
import { encodeCbor } from './cbor.ts';

/** The address of the app in the test environment (MAILBOX_URL of .env.test). */
export const TEST_ORIGIN = 'https://mail.example';
export const TEST_RP_ID = 'mail.example';

const USER_PRESENT = 0x01;
const USER_VERIFIED = 0x04;

/** A passkey of a test password manager: a P-256 key pair, as most passkeys are. */
export interface TestPasskey {
  credentialId: string;
  /** Its public key in COSE format and base64url, as the api keeps it. */
  publicKey: string;
  privateKey: KeyObject;
  /** The user handle of the account it was made for, in base64url. */
  userHandle: string;
}

export function createTestPasskey(userHandle: string): TestPasskey {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const { x = '', y = '' } = publicKey.export({ format: 'jwk' });
  // The COSE key of RFC 9053: an EC2 key (1: 2), for ES256 (3: -7), on P-256 (-1: 1).
  const coseKey = encodeCbor(
    new Map<number, number | Uint8Array>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, Buffer.from(x, 'base64url')],
      [-3, Buffer.from(y, 'base64url')],
    ]),
  );
  return {
    credentialId: randomBytes(16).toString('base64url'),
    publicKey: coseKey.toString('base64url'),
    privateKey,
    userHandle,
  };
}

export interface SignatureOptions {
  /** Signatures counted by the passkey; synced passkeys always report 0. */
  counter?: number;
  /** Whether the user unlocked the passkey with Face ID, Touch ID or a PIN. */
  userVerified?: boolean;
  origin?: string;
  rpId?: string;
  /** Another key than the passkey's own: a signature that does not match. */
  signingKey?: KeyObject;
}

/** The authenticator data of a signature: the relying party, the flags, then the counter. */
function authenticatorDataFor(rpId: string, userVerified: boolean, counter: number): Buffer {
  const counterBytes = Buffer.alloc(4);
  counterBytes.writeUInt32BE(counter);
  return Buffer.concat([
    createHash('sha256').update(rpId).digest(),
    Buffer.from([USER_PRESENT + (userVerified ? USER_VERIFIED : 0)]),
    counterBytes,
  ]);
}

/** What the browser hands over once the passkey has signed the challenge. */
export function signChallenge(
  testPasskey: TestPasskey,
  challenge: string,
  options: SignatureOptions = {},
): PasskeyAuthenticationResponse {
  const clientData = Buffer.from(
    JSON.stringify({
      type: 'webauthn.get',
      challenge,
      origin: options.origin ?? TEST_ORIGIN,
      crossOrigin: false,
    }),
  );
  const authenticatorData = authenticatorDataFor(
    options.rpId ?? TEST_RP_ID,
    options.userVerified ?? true,
    options.counter ?? 0,
  );
  const signedData = Buffer.concat([
    authenticatorData,
    createHash('sha256').update(clientData).digest(),
  ]);
  const signature = sign('sha256', signedData, options.signingKey ?? testPasskey.privateKey);
  return {
    id: testPasskey.credentialId,
    rawId: testPasskey.credentialId,
    type: 'public-key',
    response: {
      clientDataJSON: clientData.toString('base64url'),
      authenticatorData: authenticatorData.toString('base64url'),
      signature: signature.toString('base64url'),
      userHandle: testPasskey.userHandle,
    },
    clientExtensionResults: {},
  };
}
