import { AppError, type IdentityConfirmation } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** Proving again who one is on a signed-in device, before changing how one signs in. */
@Injectable()
export class IdentityConfirmationService {
  // An answer of the contract while the logic is not written, refusing every proof: replaced in a
  // next layer.

  /**
   * Marks the session as confirmed, from now.
   * @throws AppError INVALID_PASSKEY, INVALID_CREDENTIALS, INVALID_SECOND_FACTOR,
   * TOO_MANY_ATTEMPTS
   */
  async confirm(
    _confirmation: IdentityConfirmation,
    _sessionToken: string,
    _client: string,
  ): Promise<void> {
    throw new AppError('INVALID_CREDENTIALS', 'Identity not confirmed');
  }
}
