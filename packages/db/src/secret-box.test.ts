import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SecretBox } from './secret-box.ts';

const box = new SecretBox(randomBytes(32));

describe('SecretBox', () => {
  it('opens what it sealed, without the secret appearing in the sealed text', () => {
    const sealed = box.seal('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');

    expect(sealed).not.toContain('GEZDGNBV');
    expect(box.open(sealed)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  });

  it('seals the same secret differently every time', () => {
    expect(box.seal('secret')).not.toBe(box.seal('secret'));
  });

  it('refuses a sealed text that was altered', () => {
    const [nonce, authTag, ciphertext = ''] = box.seal('secret').split('.');
    const altered = Buffer.from(ciphertext, 'base64url');
    altered[0] = (altered[0] ?? 0) ^ 1;

    expect(() => box.open([nonce, authTag, altered.toString('base64url')].join('.'))).toThrow();
  });

  it('refuses a sealed text whose authentication tag was shortened', () => {
    const [nonce, authTag = '', ciphertext] = box.seal('secret').split('.');
    const shortTag = Buffer.from(authTag, 'base64url').subarray(0, 4).toString('base64url');

    expect(() => box.open([nonce, shortTag, ciphertext].join('.'))).toThrow();
  });

  it('refuses a text sealed with another key', () => {
    const sealed = new SecretBox(randomBytes(32)).seal('secret');

    expect(() => box.open(sealed)).toThrow();
  });

  it('refuses a text that is not a sealed secret', () => {
    expect(() => box.open('plain text')).toThrow();
  });
});
