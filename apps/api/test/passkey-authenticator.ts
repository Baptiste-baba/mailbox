import { createHash, generateKeyPairSync, type KeyObject, randomBytes, sign } from 'node:crypto';
import type { PasskeyAuthenticationResponse, PasskeyRegistration } from '@mailbox/shared';
import { encodeCbor } from './cbor.ts';

/** The address of the app in the test environment (MAILBOX_URL of .env.test). */
const TEST_ORIGIN = 'https://mail.example';
const TEST_RP_ID = 'mail.example';

const USER_PRESENT = 0x01;
const USER_VERIFIED = 0x04;
const ATTESTED_CREDENTIAL_DATA = 0x40;

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

export interface CeremonyOptions {
  /** Whether the user unlocked the passkey with Face ID, Touch ID or a PIN. */
  userVerified?: boolean;
  origin?: string;
  rpId?: string;
}

export interface SignatureOptions extends CeremonyOptions {
  /** Signatures counted by the passkey; synced passkeys always report 0. */
  counter?: number;
  /** Another key than the passkey's own: a signature that does not match. */
  signingKey?: KeyObject;
}

function clientDataFor(type: string, challenge: string, origin = TEST_ORIGIN): Buffer {
  return Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
}

/** The authenticator data: the relying party, the flags, the counter, then any credential data. */
function authenticatorDataFor(
  { rpId = TEST_RP_ID, userVerified = true }: CeremonyOptions,
  counter: number,
  attestedCredential?: Buffer,
): Buffer {
  const flags =
    USER_PRESENT +
    (userVerified ? USER_VERIFIED : 0) +
    (attestedCredential === undefined ? 0 : ATTESTED_CREDENTIAL_DATA);
  const counterBytes = Buffer.alloc(4);
  counterBytes.writeUInt32BE(counter);
  return Buffer.concat([
    createHash('sha256').update(rpId).digest(),
    Buffer.from([flags]),
    counterBytes,
    attestedCredential ?? Buffer.alloc(0),
  ]);
}

/** What the browser hands over once the passkey has signed the challenge. */
export function signChallenge(
  testPasskey: TestPasskey,
  challenge: string,
  options: SignatureOptions = {},
): PasskeyAuthenticationResponse {
  const clientData = clientDataFor('webauthn.get', challenge, options.origin);
  const authenticatorData = authenticatorDataFor(options, options.counter ?? 0);
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

/**
 * What the browser hands over once a password manager has created the passkey, with the "none"
 * attestation browsers give when the app asks for none.
 */
export function createPasskeyResponse(
  testPasskey: TestPasskey,
  challenge: string,
  options: CeremonyOptions = {},
): PasskeyRegistration['response'] {
  const credentialId = Buffer.from(testPasskey.credentialId, 'base64url');
  const credentialIdLength = Buffer.alloc(2);
  credentialIdLength.writeUInt16BE(credentialId.length);
  // The make of the password manager (AAGUID) stays zero without an attestation.
  const attestedCredential = Buffer.concat([
    Buffer.alloc(16),
    credentialIdLength,
    credentialId,
    Buffer.from(testPasskey.publicKey, 'base64url'),
  ]);
  const attestationObject = encodeCbor(
    new Map<string, string | Uint8Array | Map<string, string>>([
      ['fmt', 'none'],
      ['attStmt', new Map()],
      ['authData', authenticatorDataFor(options, 0, attestedCredential)],
    ]),
  );
  return {
    id: testPasskey.credentialId,
    rawId: testPasskey.credentialId,
    type: 'public-key',
    response: {
      clientDataJSON: clientDataFor('webauthn.create', challenge, options.origin).toString(
        'base64url',
      ),
      attestationObject: attestationObject.toString('base64url'),
    },
    clientExtensionResults: {},
  };
}
