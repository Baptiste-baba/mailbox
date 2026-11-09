import { account, type Database, setupCode } from '@mailbox/db';
import {
  AppError,
  type SetupEnrollmentRequest,
  type SetupRequest,
  type SetupResponse,
  type TotpEnrollment,
} from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DATABASE } from '../database/database.module.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { hashPassword } from './password-hash.ts';
import { RecoveryCodesService } from './recovery-codes.service.ts';
import { SecretBox } from './secret-box.ts';
import { replaceSetupCode } from './setup-code.ts';
import { hashToken } from './token-hash.ts';
import { TotpService } from './totp.service.ts';

/** The creation of the account, once, guarded by the one-time setup code from the server logs. */
@Injectable()
export class SetupService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @InjectPinoLogger(SetupService.name) private readonly logger: PinoLogger,
    private readonly throttle: AttemptThrottleService,
    private readonly totp: TotpService,
    private readonly secretBox: SecretBox,
    private readonly recoveryCodes: RecoveryCodesService,
  ) {}

  async isSetupRequired(): Promise<boolean> {
    const accounts = await this.database.select({ id: account.id }).from(account).limit(1);
    return accounts.length === 0;
  }

  /**
   * At startup, while no account exists: a fresh code in these logs, replacing the earlier ones,
   * which only their hashes could tell and which are in older logs, if anywhere.
   */
  async issueNewCode(): Promise<void> {
    if (!(await this.isSetupRequired())) {
      return;
    }
    const code = await this.database.transaction(replaceSetupCode);
    // The one secret written to the logs: only whoever runs the server can read them.
    this.logger.warn(
      `No account yet: open MailBox and enter the setup code ${code}, valid for an hour`,
    );
  }

  /** Issues a setup code and logs it, when no account exists and no valid code does. */
  async issueCodeIfNeeded(): Promise<void> {
    if (!(await this.hasValidCode())) {
      await this.issueNewCode();
    }
  }

  /**
   * @param client Address of the device, slowed down on its own after failures.
   * @throws AppError SETUP_NOT_AVAILABLE, INVALID_SETUP_CODE, TOO_MANY_ATTEMPTS
   */
  startTotpEnrollment(request: SetupEnrollmentRequest, client: string): Promise<TotpEnrollment> {
    return this.throttle.attempt('setup', client, async () => {
      await this.ensureValidSetupCode(request.setupCode);
      return this.totp.createEnrollment(request.username);
    });
  }

  /**
   * @throws AppError SETUP_NOT_AVAILABLE, INVALID_SETUP_CODE, INVALID_SECOND_FACTOR,
   * TOO_MANY_ATTEMPTS
   */
  createAccount(request: SetupRequest, client: string): Promise<SetupResponse> {
    return this.throttle.attempt('setup', client, async () => {
      await this.ensureValidSetupCode(request.setupCode);
      const step = this.totp.matchingStep(request.totpSecret, request.totpCode);
      if (step === undefined) {
        throw new AppError(
          'INVALID_SECOND_FACTOR',
          'The code does not match the authenticator app',
        );
      }
      const passwordHash = await hashPassword(request.password);
      const recoveryCodes = await this.database.transaction(async (transaction) => {
        const created = await transaction
          .insert(account)
          .values({
            username: request.username,
            passwordHash,
            totpSecretEncrypted: this.secretBox.seal(request.totpSecret),
            // The code that confirmed the app must not open a session afterwards.
            totpLastUsedStep: step,
          })
          .onConflictDoNothing()
          .returning({ id: account.id });
        if (created.length === 0) {
          throw new AppError('SETUP_NOT_AVAILABLE', 'The account already exists');
        }
        await transaction.delete(setupCode);
        return this.recoveryCodes.regenerate(transaction);
      });
      return { recoveryCodes };
    });
  }

  private async ensureValidSetupCode(code: string): Promise<void> {
    if (!(await this.isSetupRequired())) {
      throw new AppError('SETUP_NOT_AVAILABLE', 'The account already exists');
    }
    const matches = await this.database
      .select({ id: setupCode.id })
      .from(setupCode)
      .where(and(eq(setupCode.codeHash, hashToken(code)), gt(setupCode.expiresAt, new Date())))
      .limit(1);
    if (matches.length === 0) {
      throw new AppError('INVALID_SETUP_CODE', 'Unknown or expired setup code');
    }
  }

  private async hasValidCode(): Promise<boolean> {
    const codes = await this.database
      .select({ id: setupCode.id })
      .from(setupCode)
      .where(gt(setupCode.expiresAt, new Date()))
      .limit(1);
    return codes.length > 0;
  }
}
