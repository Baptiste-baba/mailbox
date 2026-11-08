import {
  AppError,
  RECOVERY_CODE_COUNT,
  type SetupRequest,
  type SetupResponse,
  type TotpEnrollment,
} from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

// Answers of the contract while the logic is not written: replaced in the next layer.
const FAKE_ENROLLMENT: TotpEnrollment = {
  secret: 'JBSWY3DPEHPK3PXP',
  otpauthUri: 'otpauth://totp/MailBox:alex?secret=JBSWY3DPEHPK3PXP&issuer=MailBox',
};

/** The creation of the account, once, guarded by the one-time setup code from the server logs. */
@Injectable()
export class SetupService {
  /** Issues a setup code and logs it, when no account exists and no valid code does. */
  async issueCodeIfNeeded(): Promise<void> {}

  /** @throws AppError SETUP_NOT_AVAILABLE, INVALID_SETUP_CODE */
  async startTotpEnrollment(setupCode: string): Promise<TotpEnrollment> {
    if (setupCode !== 'AAAA-AAAA-AAAA') {
      throw new AppError('INVALID_SETUP_CODE', 'Invalid setup code');
    }
    return FAKE_ENROLLMENT;
  }

  /** @throws AppError SETUP_NOT_AVAILABLE, INVALID_SETUP_CODE, INVALID_SECOND_FACTOR */
  async createAccount(request: SetupRequest): Promise<SetupResponse> {
    await this.startTotpEnrollment(request.setupCode);
    return {
      recoveryCodes: Array.from(
        { length: RECOVERY_CODE_COUNT },
        (_, index) => `ABCD-EFGH-JKL${String.fromCharCode(65 + index)}`,
      ),
    };
  }
}
