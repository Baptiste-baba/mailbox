import { AppError, type AuthStatus, type LoginRequest, type SecondFactor } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { AccountCredentialsService, type StoredAccount } from './account-credentials.service.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { verifyPassword } from './password-hash.ts';
import { RecoveryCodesService } from './recovery-codes.service.ts';
import { type ResumedSession, SessionService, type StartedSession } from './session.service.ts';
import { SetupService } from './setup.service.ts';

export interface StatusResult {
  status: AuthStatus;
  /** The session of the request, if it is valid. */
  session: ResumedSession | undefined;
}

// Phones capitalise the first letter of a field: "Alex" and "alex" are the same user.
function sameUsername(stored: string, typed: string): boolean {
  return stored.toLowerCase() === typed.toLowerCase();
}

/** Who is signed in, and signing in with the password and a second factor. */
@Injectable()
export class LoginService {
  constructor(
    private readonly credentials: AccountCredentialsService,
    private readonly setup: SetupService,
    private readonly throttle: AttemptThrottleService,
    private readonly sessions: SessionService,
    private readonly recoveryCodes: RecoveryCodesService,
  ) {}

  async status(sessionToken: string | undefined): Promise<StatusResult> {
    const stored = await this.credentials.find();
    if (stored === undefined) {
      // The setup screen asks for the status: a code that expired meanwhile is replaced at once.
      await this.setup.issueCodeIfNeeded();
      return { status: { state: 'setupRequired' }, session: undefined };
    }
    const session =
      sessionToken === undefined ? undefined : await this.sessions.resume(sessionToken);
    if (session === undefined) {
      return { status: { state: 'signedOut' }, session };
    }
    const status: AuthStatus = session.mustReplaceAuthenticator
      ? {
          state: 'authenticatorReplacementRequired',
          recoveryCodesLeft: await this.recoveryCodes.countLeft(),
        }
      : { state: 'signedIn', username: stored.username };
    return { status, session };
  }

  /**
   * @param client Address of the device, slowed down on its own after failures.
   * @throws AppError SETUP_REQUIRED, INVALID_CREDENTIALS, SECOND_FACTOR_REQUIRED,
   * INVALID_SECOND_FACTOR, TOO_MANY_ATTEMPTS
   */
  async logIn(request: LoginRequest, client: string, userAgent: string): Promise<StartedSession> {
    const found = await this.credentials.find();
    // No account, after a reset for instance: the sign-in screen sends to setup. The status says
    // as much to anyone, so this reveals nothing, and is no failed guess.
    if (found === undefined) {
      throw new AppError('SETUP_REQUIRED', 'No account yet: set it up first');
    }
    // Checked again at the second step: the sign-in keeps no state between its two requests, at
    // the cost of a second hash of the password.
    const stored = await this.throttle.attempt('password', client, () =>
      this.checkPassword(request, found),
    );
    const { secondFactor } = request;
    // Outside the throttled try: asking for the second factor is the normal next step.
    if (secondFactor === undefined) {
      throw new AppError('SECOND_FACTOR_REQUIRED', 'A second factor is required');
    }
    await this.throttle.attempt('second_factor', client, () =>
      this.checkSecondFactor(stored, secondFactor),
    );
    // A recovery code means the authenticator app is presumed lost: this session may only replace it.
    return this.sessions.start(userAgent, secondFactor.kind === 'recoveryCode');
  }

  private async checkPassword(
    request: LoginRequest,
    stored: StoredAccount,
  ): Promise<StoredAccount> {
    // The username is compared after the hash: the response time does not tell which one was wrong.
    const passwordMatches = await verifyPassword(request.password, stored.passwordHash);
    if (!passwordMatches || !sameUsername(stored.username, request.username)) {
      throw new AppError('INVALID_CREDENTIALS', 'Wrong username or password');
    }
    return stored;
  }

  private async checkSecondFactor(stored: StoredAccount, secondFactor: SecondFactor) {
    if (secondFactor.kind === 'recoveryCode') {
      if (!(await this.recoveryCodes.consume(secondFactor.code))) {
        throw new AppError('INVALID_SECOND_FACTOR', 'Unknown or already used recovery code');
      }
      return;
    }
    await this.credentials.checkTotpCode(stored, secondFactor.code);
  }
}
