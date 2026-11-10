import type { PasskeyAuthenticationResponse, PasskeyRequestOptions } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import type { ChallengePurpose } from './passkey-challenges.ts';

/** Signing in, or confirming the identity, with a passkey of the account. */
type AssertionPurpose = Extract<ChallengePurpose, 'signIn' | 'identityConfirmation'>;

/** Asks a passkey to sign a challenge of the api, then checks its signature and records its use. */
@Injectable()
export class PasskeyAssertionService {
  /** @param sessionToken The session confirming its identity; none to sign in. */
  options(_purpose: AssertionPurpose, _sessionToken?: string): Promise<PasskeyRequestOptions> {
    throw new Error('Not implemented yet');
  }

  /**
   * @throws AppError INVALID_PASSKEY for any passkey, signature or challenge the api does not
   * accept, without telling which.
   */
  verify(
    _response: PasskeyAuthenticationResponse,
    _purpose: AssertionPurpose,
    _sessionToken?: string,
  ): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
