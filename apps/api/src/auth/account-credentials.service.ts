import { account, type Database } from '@mailbox/db';
import { AppError } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { SecretBox } from './secret-box.ts';
import { TotpService } from './totp.service.ts';

export type StoredAccount = typeof account.$inferSelect;

/**
 * The account, and the code of its authenticator app checked against it: shared by signing in and
 * confirming the identity.
 */
@Injectable()
export class AccountCredentialsService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly totp: TotpService,
    private readonly secretBox: SecretBox,
  ) {}

  /** The account, once set up. */
  async find(): Promise<StoredAccount | undefined> {
    const [stored] = await this.database.select().from(account).limit(1);
    return stored;
  }

  /** @throws AppError INVALID_SECOND_FACTOR for a wrong code, or one already used. */
  async checkTotpCode(stored: StoredAccount, code: string): Promise<void> {
    const secret = this.secretBox.open(stored.totpSecretEncrypted);
    const step = this.totp.matchingStep(secret, code);
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
