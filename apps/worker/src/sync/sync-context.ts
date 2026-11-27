import type { Database, SecretBox } from '@mailbox/db';
import type { MailProviders } from '@mailbox/providers';
import type { Logger } from 'pino';

/** What copying the mail of a mailbox works with. */
export interface SyncContext {
  database: Database;
  providers: MailProviders;
  /** Opens the tokens the api sealed. */
  secretBox: SecretBox;
  logger: Logger;
  /** The least time between two mails read at a provider: how fast it lets a mailbox be read. */
  readIntervalMs: number;
}
