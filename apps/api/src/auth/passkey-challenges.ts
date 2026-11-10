import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { hashToken } from './token-hash.ts';

/**
 * What a challenge was issued for. Signing in comes before any session; confirming the identity and
 * adding a passkey belong to the session that asked.
 */
export type ChallengePurpose = 'signIn' | 'identityConfirmation' | 'registration';

/** Time to pick a passkey and unlock it, before its challenge stops working. */
export const CHALLENGE_LIFETIME_MS = 5 * 60 * 1_000;
/** Beyond this many, the oldest challenge is forgotten: asking for options cannot fill the memory. */
const MAX_PENDING_CHALLENGES = 100;
const CHALLENGE_BYTES = 32;

interface PendingChallenge {
  purpose: ChallengePurpose;
  sessionTokenHash: string | undefined;
  expiresAt: number;
}

/**
 * The random challenges passkeys sign, kept in memory: the api runs as one process, and losing them
 * on a restart only makes the user try again. Each works once, for a few minutes, for the purpose
 * and the session it was issued for.
 */
@Injectable()
export class PasskeyChallenges {
  // A Map keeps the order its keys were added in: the first one is the oldest.
  private readonly pending = new Map<string, PendingChallenge>();

  /**
   * A new challenge, in base64url.
   * @param sessionToken The session that asked, except to sign in.
   */
  issue(purpose: ChallengePurpose, sessionToken?: string): string {
    const oldest = this.pending.keys().next();
    if (this.pending.size >= MAX_PENDING_CHALLENGES && oldest.done !== true) {
      this.pending.delete(oldest.value);
    }
    const challenge = randomBytes(CHALLENGE_BYTES).toString('base64url');
    this.pending.set(challenge, {
      purpose,
      sessionTokenHash: sessionToken === undefined ? undefined : hashToken(sessionToken),
      expiresAt: Date.now() + CHALLENGE_LIFETIME_MS,
    });
    return challenge;
  }

  /** Forgets the challenge, and tells whether it was still valid for this purpose and session. */
  consume(challenge: string, purpose: ChallengePurpose, sessionToken?: string): boolean {
    const found = this.pending.get(challenge);
    this.pending.delete(challenge);
    return (
      found !== undefined &&
      found.expiresAt > Date.now() &&
      found.purpose === purpose &&
      found.sessionTokenHash === (sessionToken === undefined ? undefined : hashToken(sessionToken))
    );
  }
}
