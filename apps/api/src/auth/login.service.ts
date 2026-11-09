import { account, type Database } from '@mailbox/db';
import {
  AppError,
  type AuthStatus,
  type LoginRequest,
  type LoginResponse,
  type SecondFactor,
} from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { verifyPassword } from './password-hash.ts';
import { RecoveryCodesService } from './recovery-codes.service.ts';
import { SecretBox } from './secret-box.ts';
import { SessionService, type StartedSession } from './session.service.ts';
import { SetupService } from './setup.service.ts';
import { TotpService } from './totp.service.ts';

type StoredAccount = typeof account.$inferSelect;

export interface StatusResult {
  status: AuthStatus;
  /** The session of the request, its expiry pushed back: the cookie follows. */
  renewedSession: StartedSession | undefined;
}

export interface LoginResult {
  response: LoginResponse;
  session: StartedSession;
}

// Phones capitalise the first letter of a field: "Alex" and "alex" are the same user.
function sameUsername(stored: string, typed: string): boolean {
  return stored.toLowerCase() === typed.toLowerCase();
}

/** Who is signed in, and signing in with the password and a second factor. */
@Injectable()
export class LoginService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly setup: SetupService,
    private readonly throttle: AttemptThrottleService,
    private readonly sessions: SessionService,
    private readonly totp: TotpService,
    private readonly secretBox: SecretBox,
    private readonly recoveryCodes: RecoveryCodesService,
  ) {}

  async status(sessionToken: string | undefined): Promise<StatusResult> {
    const stored = await this.findAccount();
    if (stored === undefined) {
      // The setup screen asks for the status: a code that expired meanwhile is replaced at once.
      await this.setup.issueCodeIfNeeded();
      return { status: { state: 'setupRequired' }, renewedSession: undefined };
    }
    const renewedSession =
      sessionToken === undefined ? undefined : await this.sessions.resume(sessionToken);
    const status: AuthStatus =
      renewedSession === undefined
        ? { state: 'signedOut' }
        : { state: 'signedIn', username: stored.username };
    return { status, renewedSession };
  }

  /**
   * @param client Address of the device, slowed down on its own after failures.
   * @throws AppError SETUP_REQUIRED, INVALID_CREDENTIALS, SECOND_FACTOR_REQUIRED,
   * INVALID_SECOND_FACTOR, TOO_MANY_ATTEMPTS
   */
  async logIn(request: LoginRequest, client: string, userAgent: string): Promise<LoginResult> {
    const found = await this.findAccount();
    // No account, after a reset for instance: the sign-in screen sends to setup. The status says
    // as much to anyone, so this reveals nothing, and is no failed guess.
    if (found === undefined) {
      throw new AppError('SETUP_REQUIRED', 'No account yet: set it up first');
    }
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
    const session = await this.sessions.start(userAgent);
    const response: LoginResponse = {
      usedRecoveryCode: secondFactor.kind === 'recoveryCode',
      recoveryCodesLeft: await this.recoveryCodes.countLeft(),
    };
    return { response, session };
  }

  private async findAccount(): Promise<StoredAccount | undefined> {
    const [stored] = await this.database.select().from(account).limit(1);
    return stored;
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
    const secret = this.secretBox.open(stored.totpSecretEncrypted);
    const step = this.totp.matchingStep(secret, secondFactor.code);
    if (step === undefined || !(await this.claimTotpStep(step))) {
      throw new AppError('INVALID_SECOND_FACTOR', 'Wrong or already used code');
    }
  }

  // A code works once: its time step must come after the last one accepted. One statement, so that
  // two requests racing with the same code cannot both pass.
  private async claimTotpStep(step: number): Promise<boolean> {
    const claimed = await this.database
      .update(account)
      .set({ totpLastUsedStep: step })
      .where(
        and(
          eq(account.id, 1),
          or(isNull(account.totpLastUsedStep), lt(account.totpLastUsedStep, step)),
        ),
      )
      .returning({ id: account.id });
    return claimed.length > 0;
  }
}
