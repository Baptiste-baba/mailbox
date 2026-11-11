import { AppError, type IdentityConfirmation } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { AccountCredentialsService } from './account-credentials.service.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { PasskeyAssertionService } from './passkey-assertion.service.ts';
import { verifyPassword } from './password-hash.ts';
import { SessionService } from './session.service.ts';

type PasswordConfirmation = Extract<IdentityConfirmation, { method: 'password' }>;

/** Proving again who one is on a signed-in device, before changing how one signs in. */
@Injectable()
export class IdentityConfirmationService {
  constructor(
    private readonly credentials: AccountCredentialsService,
    private readonly assertions: PasskeyAssertionService,
    private readonly throttle: AttemptThrottleService,
    private readonly sessions: SessionService,
  ) {}

  /**
   * Marks the session as confirmed, from now.
   * @param client Address of the device, slowed down on its own after wrong passwords or codes.
   * @throws AppError INVALID_PASSKEY, INVALID_CREDENTIALS, INVALID_SECOND_FACTOR,
   * TOO_MANY_ATTEMPTS
   */
  async confirm(
    confirmation: IdentityConfirmation,
    sessionToken: string,
    client: string,
  ): Promise<void> {
    if (confirmation.method === 'passkey') {
      await this.assertions.verify(confirmation.response, sessionToken);
    } else {
      await this.checkPasswordAndCode(confirmation, client);
    }
    await this.sessions.confirmIdentity(sessionToken);
  }

  // Counted with the failures of signing in: a device guessing here is slowed down there too.
  private async checkPasswordAndCode(
    { password, totpCode }: PasswordConfirmation,
    client: string,
  ): Promise<void> {
    const stored = await this.credentials.require();
    await this.throttle.attempt('password', client, async () => {
      if (!(await verifyPassword(password, stored.passwordHash))) {
        throw new AppError('INVALID_CREDENTIALS', 'Wrong password');
      }
    });
    await this.throttle.attempt('second_factor', client, () =>
      this.credentials.checkTotpCode(stored, totpCode),
    );
  }
}
