import { createHmac } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Written apart from the api code on purpose: the tests check the api against what an app computes.
function decodeSecret(secret: string): Buffer {
  const bits = [...secret].map((character) =>
    ALPHABET.indexOf(character).toString(2).padStart(5, '0'),
  );
  const bytes = bits.join('').match(/.{8}/g) ?? [];
  return Buffer.from(bytes.map((byte) => Number.parseInt(byte, 2)));
}

/** The code an authenticator app shows right now for this secret (RFC 6238, 6 digits, 30 s). */
export function currentTotpCode(secret: string): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac('sha1', decodeSecret(secret)).update(counter).digest();
  const offset = digest.readUInt8(19) & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}
