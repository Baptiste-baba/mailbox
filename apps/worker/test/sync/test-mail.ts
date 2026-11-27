import { createDatabase, type Database, mailbox, SecretBox } from '@mailbox/db';
import type { MailProvider, ProviderMessage } from '@mailbox/shared';
import { sql } from 'drizzle-orm';
import { pino } from 'pino';
import { ReadPace } from '../../src/sync/read-pace.ts';
import type { SyncContext } from '../../src/sync/sync-context.ts';

/** The refresh token the test mailboxes were connected with. */
export const TEST_REFRESH_TOKEN = 'the-refresh-token';

export function testSecretBox(): SecretBox {
  return new SecretBox(Buffer.from(process.env.MAILBOX_SECRET_KEY ?? '', 'base64'));
}

/** A connection to the test database of `.env.test`. */
export function openTestDatabase(): Database {
  return createDatabase(process.env.DATABASE_URL ?? '', (error) => {
    throw error;
  });
}

/** What a run works with in tests: a provider for Gmail mailboxes, read without waiting. */
export function testSyncContext(database: Database, provider: MailProvider): SyncContext {
  return {
    database,
    providers: new Map([['gmail', provider]]),
    secretBox: testSecretBox(),
    logger: pino({ level: 'silent' }),
    pace: new ReadPace(0),
    accesses: new Map(),
  };
}

/** No mailbox, and so no mail: everything a mailbox owns goes with it. */
export async function resetMailTables(database: Database): Promise<void> {
  await database.execute(sql`truncate mailbox cascade`);
}

/** A mailbox just connected, as the api stores it: its id. */
export async function insertTestMailbox(
  database: Database,
  values: Partial<typeof mailbox.$inferInsert> = {},
): Promise<string> {
  const [stored] = await database
    .insert(mailbox)
    .values({
      provider: 'gmail',
      address: 'alex.martin@example.com',
      name: 'Perso',
      color: 'azur',
      refreshTokenEncrypted: testSecretBox().seal(TEST_REFRESH_TOKEN),
      ...values,
    })
    .returning({ id: mailbox.id });
  if (stored === undefined) {
    throw new Error('Storing the test mailbox returned no row');
  }
  return stored.id;
}

/** A mail as a provider gives it, in the thread of its own unless told otherwise. */
export function testMail(id: string, changes: Partial<ProviderMessage> = {}): ProviderMessage {
  return {
    providerMessageId: id,
    providerThreadId: `thread-of-${id}`,
    subject: `Sujet ${id}`,
    from: { name: 'Camille Roux', address: 'camille.roux@example.com' },
    to: [{ name: '', address: 'alex.martin@example.com' }],
    cc: [],
    sentAt: new Date('2026-11-20T09:00:00.000Z'),
    snippet: `Début de ${id}`,
    bodyText: `Texte de ${id}`,
    bodyHtml: null,
    unread: false,
    inInbox: true,
    providerFolderIds: [],
    attachments: [],
    ...changes,
  };
}
