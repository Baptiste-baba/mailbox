import type { TotpEnrollment } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** Codes of an authenticator app (RFC 6238): new secrets, and checking a code against one. */
@Injectable()
export class TotpService {
  createEnrollment(_username: string): TotpEnrollment {
    throw new Error('Not implemented yet');
  }

  /** The time step of the code when it is valid now, give or take one step; undefined otherwise. */
  matchingStep(_secret: string, _code: string): number | undefined {
    throw new Error('Not implemented yet');
  }
}
