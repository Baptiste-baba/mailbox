import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TotpService } from './totp.service.ts';

const totp = new TotpService();
// The SHA-1 secret of the RFC 6238 test vectors, "12345678901234567890", in base32.
const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TotpService', () => {
  // Appendix B of RFC 6238: its 8-digit codes, of which apps show the last 6.
  it.each([
    [59, '287082'],
    [1_111_111_109, '081804'],
    [1_111_111_111, '050471'],
    [1_234_567_890, '005924'],
    [2_000_000_000, '279037'],
    [20_000_000_000, '353130'],
  ])('accepts at %i s the code of the RFC test vectors, %s', (seconds, code) => {
    vi.setSystemTime(seconds * 1000);

    expect(totp.matchingStep(rfcSecret, code)).toBe(Math.floor(seconds / 30));
  });

  it('accepts the code of the step before or after, for a phone whose clock drifts', () => {
    vi.setSystemTime((1_111_111_109 + 30) * 1000);
    expect(totp.matchingStep(rfcSecret, '081804')).toBe(37_037_036);

    vi.setSystemTime((1_111_111_109 - 30) * 1000);
    expect(totp.matchingStep(rfcSecret, '081804')).toBe(37_037_036);
  });

  it('refuses a code two steps away, or a wrong one', () => {
    vi.setSystemTime((59 + 60) * 1000);
    expect(totp.matchingStep(rfcSecret, '287082')).toBeUndefined();

    vi.setSystemTime(59 * 1000);
    expect(totp.matchingStep(rfcSecret, '287083')).toBeUndefined();
  });

  it('gives a new secret every time, ready for an authenticator app', () => {
    const enrollment = totp.createEnrollment('alex');

    expect(enrollment.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(enrollment.otpauthUri).toBe(
      `otpauth://totp/MailBox:alex?secret=${enrollment.secret}&issuer=MailBox`,
    );
    expect(totp.createEnrollment('alex').secret).not.toBe(enrollment.secret);
  });

  it('encodes a username that holds characters with a meaning in the URI', () => {
    const { otpauthUri } = totp.createEnrollment('alex:perso?');

    expect(otpauthUri).toMatch(/^otpauth:\/\/totp\/MailBox:alex%3Aperso%3F\?secret=/);
  });
});
