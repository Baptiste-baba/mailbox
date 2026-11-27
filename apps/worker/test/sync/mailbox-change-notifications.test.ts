import { type Database, listenToMailboxChanges, type MailboxChangesListener } from '@mailbox/db';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyMailboxPage } from '../../src/sync/copy-mailbox-page.ts';
import { removeMessage } from '../../src/sync/remove-message.ts';
import { storeMessage } from '../../src/sync/store-message.ts';
import { recordSyncFailure } from '../../src/sync/sync-health.ts';
import { FakeProvider } from './fake-provider.ts';
import {
  insertTestMailbox,
  neverStopped,
  openTestDatabase,
  resetMailTables,
  testMail,
  testSyncContext,
} from './test-mail.ts';

let database: Database;
let listener: MailboxChangesListener;
let told: string[];
let mailboxId: string;

beforeEach(async () => {
  database ??= openTestDatabase();
  await resetMailTables(database);
  mailboxId = await insertTestMailbox(database);
  told = [];
  listener = await listenToMailboxChanges(process.env.DATABASE_URL ?? '', {
    onChange: (payload) => told.push(payload),
    onLost: (error) => {
      throw error;
    },
  });
});

afterEach(async () => {
  await listener.close();
});

afterAll(async () => {
  await database.$client.end();
});

/** What was told of the test mailbox, once Postgres had time to deliver it. */
async function toldOfMailbox(): Promise<number> {
  await database.execute('select 1');
  return told.filter((payload) => payload === mailboxId).length;
}

describe('telling what changes in a mailbox', () => {
  it('tells a mail stored, then removed', async () => {
    await storeMessage(database, mailboxId, testMail('m1'));
    await expect.poll(toldOfMailbox).toBe(1);

    await removeMessage(database, mailboxId, 'm1');

    await expect.poll(toldOfMailbox).toBe(2);
  });

  it('tells a mailbox that could not be read', async () => {
    await recordSyncFailure(database, mailboxId, new Error('No answer'));

    await expect.poll(toldOfMailbox).toBe(1);
  });

  it('tells a copy that is over, once for each mail and once for the end', async () => {
    const provider = new FakeProvider();
    provider.mails = [testMail('m1')];

    await copyMailboxPage(testSyncContext(database, provider), mailboxId, neverStopped);

    await expect.poll(toldOfMailbox).toBe(2);
  });

  it('tells nothing of a mail that was never stored', async () => {
    await removeMessage(database, mailboxId, 'never-stored');
    await storeMessage(database, mailboxId, testMail('m1'));

    await expect.poll(toldOfMailbox).toBe(1);
  });
});
