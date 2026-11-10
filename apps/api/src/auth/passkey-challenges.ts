import { Injectable } from '@nestjs/common';

/**
 * What a challenge was issued for. Signing in comes before any session; confirming the identity and
 * adding a passkey belong to the session that asked.
 */
export type ChallengePurpose = 'signIn' | 'identityConfirmation' | 'registration';

/**
 * The random challenges passkeys sign, kept in memory: the api runs as one process, and losing them
 * on a restart only makes the user try again. Each works once, for a few minutes, for the purpose
 * and the session it was issued for.
 */
@Injectable()
export class PasskeyChallenges {
  /** @param sessionTokenHash The session that asked, except to sign in. */
  issue(_purpose: ChallengePurpose, _sessionTokenHash?: string): string {
    throw new Error('Not implemented yet');
  }

  /** Forgets the challenge, and tells whether it was still valid for this purpose and session. */
  consume(_challenge: string, _purpose: ChallengePurpose, _sessionTokenHash?: string): boolean {
    throw new Error('Not implemented yet');
  }
}
