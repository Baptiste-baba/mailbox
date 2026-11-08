import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password-hash.ts';

describe('password hash', () => {
  it('accepts the password it hashed, and refuses any other', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('correct horse battery stapl', hash)).toBe(false);
  });

  it('hashes with Argon2id at the recommended cost, never keeping the password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(hash).not.toContain('correct');
  });

  it('salts every hash, so that equal passwords do not give equal hashes', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });

  it('accepts the password whichever Unicode form the device sends', async () => {
    const hash = await hashPassword('mot de passe déjà vu');

    expect(await verifyPassword('mot de passe déjà vu', hash)).toBe(true);
  });

  it('refuses a stored hash it cannot read', async () => {
    await expect(verifyPassword('password', 'plain text')).rejects.toThrow();
  });
});
