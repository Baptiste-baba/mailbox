import { randomInt } from 'node:crypto';
import { BASE32_ALPHABET } from './base32.ts';

const GROUP_COUNT = 3;
const GROUP_LENGTH = 4;

/**
 * A random code such as K7QD-M2XA-PT4R, easy to read and type: 60 bits, for the setup code and the
 * recovery codes.
 */
export function generateGroupedCode(): string {
  return Array.from({ length: GROUP_COUNT }, () =>
    Array.from({ length: GROUP_LENGTH }, () =>
      BASE32_ALPHABET.charAt(randomInt(BASE32_ALPHABET.length)),
    ).join(''),
  ).join('-');
}
