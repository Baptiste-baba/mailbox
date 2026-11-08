import type { TotpConfirmation, TotpEnrollment } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** Changes to the signed-in account: a new authenticator app, after a recovery code for instance. */
@Injectable()
export class AccountService {
  startTotpEnrollment(): Promise<TotpEnrollment> {
    throw new Error('Not implemented yet');
  }

  /** @throws AppError INVALID_SECOND_FACTOR when the code does not match the new secret. */
  replaceTotp(_confirmation: TotpConfirmation): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
