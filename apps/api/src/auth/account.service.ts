import { account, type Database } from '@mailbox/db';
import { AppError, type TotpConfirmation, type TotpEnrollment } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../database/database.module.ts';
import { SecretBox } from './secret-box.ts';
import { SessionService } from './session.service.ts';
import { TotpService } from './totp.service.ts';

/** Changes to the signed-in account: a new authenticator app, after a recovery code for instance. */
@Injectable()
export class AccountService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly totp: TotpService,
    private readonly secretBox: SecretBox,
    private readonly sessions: SessionService,
  ) {}

  /** @throws AppError UNAUTHENTICATED while no account exists. */
  async startTotpEnrollment(): Promise<TotpEnrollment> {
    const [stored] = await this.database
      .select({ username: account.username })
      .from(account)
      .limit(1);
    if (stored === undefined) {
      throw new AppError('UNAUTHENTICATED', 'No account yet');
    }
    return this.totp.createEnrollment(stored.username);
  }

  /**
   * The new app replaces the former one at once: codes of the former app stop working.
   * @throws AppError INVALID_SECOND_FACTOR when the code does not match the new secret,
   * UNAUTHENTICATED while no account exists.
   */
  async replaceTotp(confirmation: TotpConfirmation): Promise<void> {
    const step = this.totp.matchingStep(confirmation.totpSecret, confirmation.totpCode);
    if (step === undefined) {
      throw new AppError('INVALID_SECOND_FACTOR', 'The code does not match the authenticator app');
    }
    const replaced = await this.database
      .update(account)
      .set({
        totpSecretEncrypted: this.secretBox.seal(confirmation.totpSecret),
        totpLastUsedStep: step,
        updatedAt: new Date(),
      })
      .returning({ id: account.id });
    if (replaced.length === 0) {
      throw new AppError('UNAUTHENTICATED', 'No account yet');
    }
    await this.sessions.endAuthenticatorReplacement();
  }
}
