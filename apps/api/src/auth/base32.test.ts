import { describe, expect, it } from 'vitest';
import { decodeBase32, encodeBase32 } from './base32.ts';

// Test vectors of RFC 4648, section 10, without their padding.
const vectors = [
  ['', ''],
  ['f', 'MY'],
  ['fo', 'MZXQ'],
  ['foo', 'MZXW6'],
  ['foob', 'MZXW6YQ'],
  ['fooba', 'MZXW6YTB'],
  ['foobar', 'MZXW6YTBOI'],
];

describe('base32', () => {
  it.each(vectors)('encodes %j as %j', (text, encoded) => {
    expect(encodeBase32(Buffer.from(text))).toBe(encoded);
  });

  it.each(vectors)('decodes %j back from %j', (text, encoded) => {
    expect(decodeBase32(encoded).toString()).toBe(text);
  });

  it('refuses a character outside the alphabet', () => {
    expect(() => decodeBase32('MZXW1')).toThrow();
  });
});
