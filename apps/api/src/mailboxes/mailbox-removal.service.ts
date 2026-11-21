import { type Database, mailbox, SecretBox } from '@mailbox/db';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DATABASE } from '../database/database.module.ts';
import { MAIL_PROVIDERS, type MailProviders, requireMailProvider } from './mail-providers.ts';

@Injectable()
export class MailboxRemovalService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @Inject(MAIL_PROVIDERS) private readonly mailProviders: MailProviders,
    @InjectPinoLogger(MailboxRemovalService.name) private readonly logger: PinoLogger,
    private readonly secretBox: SecretBox,
  ) {}

  /**
   * Ends the access at the provider, then removes the mailbox with the mail mirrored from it.
   * Removing one already gone changes nothing.
   * @throws AppError MAIL_PROVIDER_UNAVAILABLE when the access could not be ended: the mailbox stays.
   * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
   */
  async remove(mailboxId: string): Promise<void> {
    const [stored] = await this.database
      .select({ provider: mailbox.provider, sealedToken: mailbox.refreshTokenEncrypted })
      .from(mailbox)
      .where(eq(mailbox.id, mailboxId));
    if (stored === undefined) {
      return;
    }
    const refreshToken = this.openRefreshToken(mailboxId, stored.sealedToken);
    if (refreshToken !== undefined) {
      await requireMailProvider(this.mailProviders, stored.provider).revoke(refreshToken);
    }
    await this.database.delete(mailbox).where(eq(mailbox.id, mailboxId));
  }

  // A token sealed with a key the configuration no longer holds can be read by no one: there is
  // nothing left to end the access with, and the mailbox must remain removable.
  private openRefreshToken(mailboxId: string, sealedToken: string): string | undefined {
    try {
      return this.secretBox.open(sealedToken);
    } catch (error) {
      this.logger.warn(
        { err: error, mailboxId },
        'Unreadable refresh token: the mailbox goes without its access being ended at the provider',
      );
      return undefined;
    }
  }
}
