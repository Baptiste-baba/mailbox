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

describe('passkey challenges', () => {
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

  it('keeps 100 challenges at most, forgetting the oldest', () => {
    const oldest = challenges.issue('signIn');
    const second = challenges.issue('signIn');
    for (let issued = 2; issued <= 100; issued++) {
      challenges.issue('signIn');
    }

    expect(challenges.consume(oldest, 'signIn')).toBe(false);
    expect(challenges.consume(second, 'signIn')).toBe(true);
  });
});

describe('passkey challenges, purpose and session', () => {
  it('refuses a challenge for another purpose, and uses it up all the same', () => {
    const challenge = challenges.issue('identityConfirmation', 'session-a');

    expect(challenges.consume(challenge, 'signIn')).toBe(false);
    expect(challenges.consume(challenge, 'identityConfirmation', 'session-a')).toBe(false);
  });

  it('accepts a challenge from the session it was issued to only', () => {
    const forA = challenges.issue('registration', 'session-a');
    const alsoForA = challenges.issue('registration', 'session-a');

    expect(challenges.consume(forA, 'registration', 'session-b')).toBe(false);
    expect(challenges.consume(alsoForA, 'registration', 'session-a')).toBe(true);
  });

  it('refuses a sign-in challenge to a session', () => {
    const challenge = challenges.issue('signIn');

    expect(challenges.consume(challenge, 'signIn', 'session-a')).toBe(false);
  });
});
