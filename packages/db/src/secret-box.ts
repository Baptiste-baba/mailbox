import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts the secrets kept in the database with the key of the configuration, which is never
 * stored: a copy of the database alone reveals none of them.
 */
export class SecretBox {
  constructor(private readonly key: Buffer) {}

  /** The text encrypted and authenticated; a fresh nonce makes every result different. */
  seal(plaintext: string): string {
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, nonce, { authTagLength: AUTH_TAG_LENGTH });
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [nonce, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString('base64url'))
      .join('.');
  }

  /** @throws Error when the sealed text was altered, or sealed with another key. */
  open(sealed: string): string {
    const [nonce, authTag, ciphertext, ...extraParts] = sealed.split('.');
    if (
      nonce === undefined ||
      authTag === undefined ||
      ciphertext === undefined ||
      extraParts.length > 0
    ) {
      throw new Error('Not a sealed secret');
    }
    // A fixed tag length: a shortened tag would otherwise be accepted, and be easier to forge.
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(nonce, 'base64url'), {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
