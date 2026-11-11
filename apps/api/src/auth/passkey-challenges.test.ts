import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHALLENGE_LIFETIME_MS,
  PasskeyChallenges,
  type SessionChallengeScope,
} from './passkey-challenges.ts';

let challenges: PasskeyChallenges;

const addingOnA: SessionChallengeScope = { purpose: 'registration', sessionToken: 'session-a' };
const addingOnB: SessionChallengeScope = { purpose: 'registration', sessionToken: 'session-b' };
const confirmingOnA: SessionChallengeScope = {
  purpose: 'identityConfirmation',
  sessionToken: 'session-a',
};

beforeEach(() => {
  vi.useFakeTimers();
  challenges = new PasskeyChallenges();
});

afterEach(() => {
  vi.useRealTimers();
});

function issueSignInChallenges(count: number): void {
  for (let issued = 0; issued < count; issued++) {
    challenges.issue();
  }
}

describe('passkey challenges, signing in', () => {
  it('issues 32 random bytes in base64url, never the same twice', () => {
    const first = challenges.issue();
    const second = challenges.issue();

    expect(Buffer.from(first, 'base64url')).toHaveLength(32);
    expect(first).not.toBe(second);
  });

  it('accepts a challenge once only', () => {
    const challenge = challenges.issue();

    expect(challenges.consume(challenge)).toBe(true);
    expect(challenges.consume(challenge)).toBe(false);
  });

  it('refuses a challenge once its time is up', () => {
    const challenge = challenges.issue();

    vi.advanceTimersByTime(CHALLENGE_LIFETIME_MS);

    expect(challenges.consume(challenge)).toBe(false);
  });

  it('refuses a challenge it never issued', () => {
    expect(challenges.consume('bmV2ZXItaXNzdWVk')).toBe(false);
  });

  it('keeps 1,000 challenges at most, forgetting the oldest', () => {
    const oldest = challenges.issue();
    const second = challenges.issue();
    issueSignInChallenges(999);

    expect(challenges.consume(oldest)).toBe(false);
    expect(challenges.consume(second)).toBe(true);
  });
});

describe('passkey challenges, of a session', () => {
  it('accepts a challenge for the session and purpose it was issued for only', () => {
    const challenge = challenges.issue(addingOnA);

    expect(challenges.consume(challenge, addingOnB)).toBe(false);
    expect(challenges.consume(challenge, confirmingOnA)).toBe(false);
    expect(challenges.consume(challenge)).toBe(false);
    expect(challenges.consume(challenge, addingOnA)).toBe(true);
    expect(challenges.consume(challenge, addingOnA)).toBe(false);
  });

  it('refuses a sign-in challenge to a session', () => {
    const challenge = challenges.issue();

    expect(challenges.consume(challenge, confirmingOnA)).toBe(false);
  });

  it('replaces the challenge a session had for the same purpose', () => {
    const former = challenges.issue(confirmingOnA);
    const latest = challenges.issue(confirmingOnA);

    expect(challenges.consume(former, confirmingOnA)).toBe(false);
    expect(challenges.consume(latest, confirmingOnA)).toBe(true);
  });

  it('refuses a challenge of a session once its time is up', () => {
    const challenge = challenges.issue(confirmingOnA);

    vi.advanceTimersByTime(CHALLENGE_LIFETIME_MS);

    expect(challenges.consume(challenge, confirmingOnA)).toBe(false);
  });

  // Regression: anyone asking to sign in again and again pushed out the challenges of sessions.
  it('keeps the challenge of a session, however many sign-in challenges are asked for', () => {
    const challenge = challenges.issue(confirmingOnA);

    issueSignInChallenges(1_001);

    expect(challenges.consume(challenge, confirmingOnA)).toBe(true);
  });
});
