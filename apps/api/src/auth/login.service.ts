import type { AuthStatus, LoginRequest, LoginResponse } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

/** Who is signed in, and signing in with the password and a second factor. */
@Injectable()
export class LoginService {
  status(_sessionToken: string | undefined): Promise<AuthStatus> {
    throw new Error('Not implemented yet');
  }

  /**
   * @throws AppError INVALID_CREDENTIALS, SECOND_FACTOR_REQUIRED, INVALID_SECOND_FACTOR,
   * TOO_MANY_ATTEMPTS
   */
  logIn(_request: LoginRequest): Promise<LoginResponse> {
    throw new Error('Not implemented yet');
  }
}
