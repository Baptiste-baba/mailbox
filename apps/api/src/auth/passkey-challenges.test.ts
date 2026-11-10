import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHALLENGE_LIFETIME_MS, PasskeyChallenges } from './passkey-challenges.ts';

let challenges: PasskeyChallenges;

beforeEach(() => {
  vi.useFakeTimers();
  challenges = new PasskeyChallenges();
});

afterEach(() => {
  vi.useRealTimers();
});

function issueSignInChallenges(count: number): void {
  for (let issued = 0; issued < count; issued++) {
    challenges.issue('signIn');
  }
}

describe('passkey challenges, signing in', () => {
  it('issues 32 random bytes in base64url, never the same twice', () => {
    const first = challenges.issue('signIn');
    const second = challenges.issue('signIn');

    expect(Buffer.from(first, 'base64url')).toHaveLength(32);
    expect(first).not.toBe(second);
  });

  it('accepts a challenge once only', () => {
    const challenge = challenges.issue('signIn');

    expect(challenges.consume(challenge, 'signIn')).toBe(true);
    expect(challenges.consume(challenge, 'signIn')).toBe(false);
  });

  it('refuses a challenge once its time is up', () => {
    const challenge = challenges.issue('signIn');

    vi.advanceTimersByTime(CHALLENGE_LIFETIME_MS);

    expect(challenges.consume(challenge, 'signIn')).toBe(false);
  });

  it('refuses a challenge it never issued', () => {
    expect(challenges.consume('bmV2ZXItaXNzdWVk', 'signIn')).toBe(false);
  });

  it('keeps 1,000 challenges at most, forgetting the oldest', () => {
    const oldest = challenges.issue('signIn');
    const second = challenges.issue('signIn');
    issueSignInChallenges(999);

    expect(challenges.consume(oldest, 'signIn')).toBe(false);
    expect(challenges.consume(second, 'signIn')).toBe(true);
  });
});

describe('passkey challenges, of a session', () => {
  it('accepts a challenge for the session and purpose it was issued for only', () => {
    const challenge = challenges.issue('registration', 'session-a');

    expect(challenges.consume(challenge, 'registration', 'session-b')).toBe(false);
    expect(challenges.consume(challenge, 'identityConfirmation', 'session-a')).toBe(false);
    expect(challenges.consume(challenge, 'signIn')).toBe(false);
    expect(challenges.consume(challenge, 'registration', 'session-a')).toBe(true);
    expect(challenges.consume(challenge, 'registration', 'session-a')).toBe(false);
  });

  it('refuses a sign-in challenge to a session', () => {
    const challenge = challenges.issue('signIn');

    expect(challenges.consume(challenge, 'signIn', 'session-a')).toBe(false);
  });

  it('replaces the challenge a session had for the same purpose', () => {
    const former = challenges.issue('identityConfirmation', 'session-a');
    const latest = challenges.issue('identityConfirmation', 'session-a');

    expect(challenges.consume(former, 'identityConfirmation', 'session-a')).toBe(false);
    expect(challenges.consume(latest, 'identityConfirmation', 'session-a')).toBe(true);
  });

  it('refuses a challenge of a session once its time is up', () => {
    const challenge = challenges.issue('identityConfirmation', 'session-a');

    vi.advanceTimersByTime(CHALLENGE_LIFETIME_MS);

    expect(challenges.consume(challenge, 'identityConfirmation', 'session-a')).toBe(false);
  });

  // Regression: anyone asking to sign in again and again pushed out the challenges of sessions.
  it('keeps the challenge of a session, however many sign-in challenges are asked for', () => {
    const challenge = challenges.issue('identityConfirmation', 'session-a');

    issueSignInChallenges(1_001);

    expect(challenges.consume(challenge, 'identityConfirmation', 'session-a')).toBe(true);
  });
});
