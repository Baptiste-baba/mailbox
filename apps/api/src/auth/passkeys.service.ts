import type { PasskeyCreationOptions, PasskeyList, PasskeyRegistration } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** The passkeys of the account: listing, adding and removing them. */
@Injectable()
export class PasskeysService {
  list(): Promise<PasskeyList> {
    throw new Error('Not implemented yet');
  }

  /** @param sessionToken The session adding the passkey: only it may finish the addition. */
  creationOptions(_sessionToken: string): Promise<PasskeyCreationOptions> {
    throw new Error('Not implemented yet');
  }

  /**
   * @throws AppError INVALID_PASSKEY when the passkey, or the challenge it answers, is not
   * accepted.
   */
  add(_registration: PasskeyRegistration, _sessionToken: string): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /** Removing a passkey already gone changes nothing. */
  remove(_passkeyId: string): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
