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
/**
 * Anyone may ask to sign in: beyond this many sign-in challenges, the oldest is forgotten, so that
 * asking again and again can neither fill the memory nor easily push out the user's own.
 */
const MAX_SIGN_IN_CHALLENGES = 1_000;
const CHALLENGE_BYTES = 32;

interface SessionChallenge {
  challenge: string;
  expiresAt: number;
}

/**
 * The random challenges passkeys sign, kept in memory: the api runs as one process, and losing them
 * on a restart only makes the user try again. Each works once, for a few minutes, for the purpose
 * and the session it was issued for. Those of a session are kept apart from the sign-in ones, one
 * per purpose: requests without a session never push them out.
 */
@Injectable()
export class PasskeyChallenges {
  /** Each sign-in challenge, with when it expires. A Map keeps them oldest first. */
  private readonly signInChallenges = new Map<string, number>();
  /** The pending challenge of each session and purpose. */
  private readonly sessionChallenges = new Map<string, SessionChallenge>();

  /**
   * A new challenge, in base64url. For a session, it replaces the one it had for this purpose.
   * @param sessionToken The session that asked, except to sign in.
   */
  issue(purpose: ChallengePurpose, sessionToken?: string): string {
    const challenge = randomBytes(CHALLENGE_BYTES).toString('base64url');
    const expiresAt = Date.now() + CHALLENGE_LIFETIME_MS;
    if (sessionToken === undefined) {
      this.forgetOldestSignInWhenFull();
      this.signInChallenges.set(challenge, expiresAt);
    } else {
      this.forgetExpiredSessionChallenges();
      this.sessionChallenges.set(sessionKey(purpose, sessionToken), { challenge, expiresAt });
    }
    return challenge;
  }

  /** Forgets the challenge, and tells whether it was still valid for this purpose and session. */
  consume(challenge: string, purpose: ChallengePurpose, sessionToken?: string): boolean {
    if (sessionToken === undefined) {
      const expiresAt = this.signInChallenges.get(challenge);
      this.signInChallenges.delete(challenge);
      return purpose === 'signIn' && expiresAt !== undefined && expiresAt > Date.now();
    }
    const key = sessionKey(purpose, sessionToken);
    const pending = this.sessionChallenges.get(key);
    if (pending?.challenge !== challenge) {
      return false;
    }
    this.sessionChallenges.delete(key);
    return pending.expiresAt > Date.now();
  }

  private forgetOldestSignInWhenFull(): void {
    const oldest = this.signInChallenges.keys().next();
    if (this.signInChallenges.size >= MAX_SIGN_IN_CHALLENGES && oldest.done !== true) {
      this.signInChallenges.delete(oldest.value);
    }
  }

  // Sessions are few: the user's own devices. Going through them all costs nothing.
  private forgetExpiredSessionChallenges(): void {
    const now = Date.now();
    for (const [key, pending] of this.sessionChallenges) {
      if (pending.expiresAt <= now) {
        this.sessionChallenges.delete(key);
      }
    }
  }
}

function sessionKey(purpose: ChallengePurpose, sessionToken: string): string {
  return `${purpose}:${hashToken(sessionToken)}`;
}
