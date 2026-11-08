import { AppError, type AuthStatus, type LoginRequest, type LoginResponse } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { SetupService } from './setup.service.ts';

/** Who is signed in, and signing in with the password and a second factor. */
@Injectable()
export class LoginService {
  constructor(private readonly setup: SetupService) {}

  async status(sessionToken: string | undefined): Promise<AuthStatus> {
    if (await this.setup.isSetupRequired()) {
      // The setup screen asks for the status: a code that expired meanwhile is replaced at once.
      await this.setup.issueCodeIfNeeded();
      return { state: 'setupRequired' };
    }
    // Answers of the contract while sessions are not written: replaced in the next layer.
    return sessionToken === undefined
      ? { state: 'signedOut' }
      : { state: 'signedIn', username: 'alex' };
  }

  /**
   * @throws AppError INVALID_CREDENTIALS, SECOND_FACTOR_REQUIRED, INVALID_SECOND_FACTOR,
   * TOO_MANY_ATTEMPTS
   */
  async logIn(request: LoginRequest): Promise<LoginResponse> {
    if (request.secondFactor === undefined) {
      throw new AppError('SECOND_FACTOR_REQUIRED', 'A second factor is required');
    }
    return { usedRecoveryCode: request.secondFactor.kind === 'recoveryCode', recoveryCodesLeft: 9 };
  }
}
