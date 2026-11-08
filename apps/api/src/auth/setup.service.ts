import type { SetupRequest, SetupResponse, TotpEnrollment } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** The creation of the account, once, guarded by the one-time setup code from the server logs. */
@Injectable()
export class SetupService {
  /** Issues a setup code and logs it, when no account exists and no valid code does. */
  issueCodeIfNeeded(): Promise<void> {
    throw new Error('Not implemented yet');
  }

  /** @throws AppError SETUP_NOT_AVAILABLE, INVALID_SETUP_CODE */
  startTotpEnrollment(_setupCode: string): Promise<TotpEnrollment> {
    throw new Error('Not implemented yet');
  }

  /** @throws AppError SETUP_NOT_AVAILABLE, INVALID_SETUP_CODE, INVALID_SECOND_FACTOR */
  createAccount(_request: SetupRequest): Promise<SetupResponse> {
    throw new Error('Not implemented yet');
  }
}
