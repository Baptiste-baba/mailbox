import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { TotpEnrollment } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { decodeBase32, encodeBase32 } from './base32.ts';

const ISSUER = 'MailBox';
// 160 bits, the secret length RFC 4226 recommends.
const SECRET_LENGTH = 20;
const STEP_SECONDS = 30;
const DIGITS = 6;
// The codes just before and after the current one pass too: a phone's clock drifts a little.
const ALLOWED_DRIFT_STEPS = 1;

// HOTP (RFC 4226) on the time step: what authenticator apps compute, with SHA-1 and 6 digits.
function codeAt(key: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', key).update(counter).digest();
  const offset = digest.readUInt8(digest.length - 1) & 0x0f;
  const truncated = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(truncated % 10 ** DIGITS).padStart(DIGITS, '0');
}

/** Codes of an authenticator app (RFC 6238): new secrets, and checking a code against one. */
@Injectable()
export class TotpService {
  createEnrollment(username: string): TotpEnrollment {
    const secret = encodeBase32(randomBytes(SECRET_LENGTH));
    const label = `${encodeURIComponent(ISSUER)}:${encodeURIComponent(username)}`;
    return {
      secret,
      otpauthUri: `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}`,
    };
  }

  /** The time step of the code when it is valid now, give or take one step; undefined otherwise. */
  matchingStep(secret: string, code: string): number | undefined {
    const key = decodeBase32(secret);
    const currentStep = Math.floor(Date.now() / 1000 / STEP_SECONDS);
    for (let drift = -ALLOWED_DRIFT_STEPS; drift <= ALLOWED_DRIFT_STEPS; drift += 1) {
      const step = currentStep + drift;
      if (timingSafeEqual(Buffer.from(codeAt(key, step)), Buffer.from(code))) {
        return step;
      }
    }
    return undefined;
  }
}
