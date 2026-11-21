import { describe, expect, it } from 'vitest';
import { codeChallengeOf, createCodeVerifier } from './pkce.ts';

describe('PKCE', () => {
  it('derives the challenge of RFC 7636 from its example verifier', () => {
    const challenge = codeChallengeOf('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');

    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('creates verifiers of the length and alphabet providers accept', () => {
    expect(createCodeVerifier()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('creates a different verifier for each connection', () => {
    expect(createCodeVerifier()).not.toBe(createCodeVerifier());
  });
});
