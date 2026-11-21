import { createHash, randomBytes } from 'node:crypto';

const CODE_VERIFIER_BYTES = 32;

/**
 * A fresh secret for one connection (PKCE, RFC 7636). The provider first sees its challenge only,
 * then the secret itself with the code: a code read on its way back is of no use without it.
 */
export function createCodeVerifier(): string {
  return randomBytes(CODE_VERIFIER_BYTES).toString('base64url');
}

/** What the provider is shown of a code verifier before the user signs in (method S256). */
export function codeChallengeOf(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}
