import {
  AppError,
  type PasskeyAuthenticationResponse,
  type PasskeyRequestOptions,
} from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import type { ChallengePurpose } from './passkey-challenges.ts';
import { RelyingParty } from './relying-party.ts';

/** Signing in, or confirming the identity, with a passkey of the account. */
type AssertionPurpose = Extract<ChallengePurpose, 'signIn' | 'identityConfirmation'>;

/** Asks a passkey to sign a challenge of the api, then checks its signature and records its use. */
@Injectable()
export class PasskeyAssertionService {
  constructor(private readonly relyingParty: RelyingParty) {}

  // Answers of the contract while the logic is not written: replaced in the next layers.

  /** @param sessionToken The session confirming its identity; none to sign in. */
  async options(
    _purpose: AssertionPurpose,
    _sessionToken?: string,
  ): Promise<PasskeyRequestOptions> {
    return {
      challenge: 'Y2hhbGxlbmdlLW9mLXRoZS1hcGk',
      rpId: this.relyingParty.id,
      timeout: 300_000,
      userVerification: 'required',
    };
  }

  /**
   * @throws AppError INVALID_PASSKEY for any passkey, signature or challenge the api does not
   * accept, without telling which.
   */
  async verify(
    _response: PasskeyAuthenticationResponse,
    _purpose: AssertionPurpose,
    _sessionToken?: string,
  ): Promise<void> {
    throw new AppError('INVALID_PASSKEY', 'This passkey is not accepted');
  }
}
