import type { Database, SecretBox } from '@mailbox/db';
import type { MailProviders } from '@mailbox/providers';
import type { Logger } from 'pino';
import type { ReadPace } from './read-pace.ts';

/** An access a provider gave to read a mailbox, kept for as long as it holds. */
export interface KeptAccess {
  /** The sealed token it was renewed with: signing in again gives another, and a new access. */
  refreshTokenEncrypted: string;
  accessToken: string;
  expiresAt: Date;
}

/** What keeping the mail of the mailboxes in line with their providers works with. */
export interface SyncContext {
  database: Database;
  providers: MailProviders;
  /** Opens the tokens the api sealed. */
  secretBox: SecretBox;
  logger: Logger;
  pace: ReadPace;
  /** The accesses in use, by mailbox id. They never leave the memory of the worker. */
  accesses: Map<string, KeptAccess>;
}
