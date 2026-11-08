import type { TotpConfirmation, TotpEnrollment } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** Changes to the signed-in account: a new authenticator app, after a recovery code for instance. */
@Injectable()
export class AccountService {
  // Answers of the contract while the logic is not written: replaced in the next layer.
  async startTotpEnrollment(): Promise<TotpEnrollment> {
    return {
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
      otpauthUri:
        'otpauth://totp/MailBox:alex?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=MailBox',
    };
  }

  /** @throws AppError INVALID_SECOND_FACTOR when the code does not match the new secret. */
  async replaceTotp(_confirmation: TotpConfirmation): Promise<void> {}
}
