import { type Database, mailbox, message } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { type CopyOutcome, copyMailboxPage } from '../../src/sync/copy-mailbox-page.ts';
import type { SyncContext } from '../../src/sync/sync-context.ts';
import { syncMailboxChanges } from '../../src/sync/sync-mailbox-changes.ts';
import { FakeProvider } from './fake-provider.ts';
import {
  insertTestMailbox,
  openTestDatabase,
  resetMailTables,
  testMail,
  testSyncContext,
} from './test-mail.ts';

const neverStopped = new AbortController().signal;

let database: Database;
let provider: FakeProvider;
let context: SyncContext;
let mailboxId: string;

beforeEach(async () => {
  database ??= openTestDatabase();
  await resetMailTables(database);
  mailboxId = await insertTestMailbox(database);
  provider = new FakeProvider();
  provider.mails = ['m3', 'm2', 'm1'].map((id) => testMail(id));
  context = testSyncContext(database, provider);
});

afterAll(async () => {
  await database.$client.end();
});

async function copyWholeMailbox(): Promise<void> {
  let outcome: CopyOutcome = 'more';
  while (outcome === 'more') {
    outcome = await copyMailboxPage(context, mailboxId, neverStopped);
  }
}

async function storedMailbox() {
  const [stored] = await database.select().from(mailbox).where(eq(mailbox.id, mailboxId));
  return stored;
}

describe('what changes while a mailbox is copied', () => {
  it('is read from before the first page was listed', async () => {
    await copyMailboxPage(context, mailboxId, neverStopped);
    provider.receive(testMail('m4'));
    await copyWholeMailbox();

    await syncMailboxChanges(context, mailboxId, neverStopped);

    const stored = await database.select({ id: message.providerMessageId }).from(message);
    expect(stored.map((row) => row.id).sort()).toEqual(['m1', 'm2', 'm3', 'm4']);
  });

  it('keeps the same starting point however many pages are copied', async () => {
    await copyMailboxPage(context, mailboxId, neverStopped);
    provider.receive(testMail('m4'));

    await copyMailboxPage(context, mailboxId, neverStopped);

    expect((await storedMailbox())?.syncCursor).toBe('0');
  });
});

describe('copying a mailbox again, the provider having lost what changed', () => {
  beforeEach(async () => {
    await copyWholeMailbox();
    // While the server was off for long: a mail changed, one was deleted, one arrived.
    provider.mails = [testMail('m4'), testMail('m3', { unread: true }), testMail('m1')];
    provider.changedIds = ['m3', 'm2', 'm4', 'm4', 'm4', 'm4'];
    provider.oldestCursorKept = 5;
    provider.readIds = [];
    await syncMailboxChanges(context, mailboxId, neverStopped);
  });

  it('reads every mail again, and ends with what the provider holds', async () => {
    await copyWholeMailbox();

    const stored = await database
      .select({ id: message.providerMessageId, unread: message.unread })
      .from(message)
      .orderBy(message.providerMessageId);
    expect(stored).toEqual([
      { id: 'm1', unread: false },
      { id: 'm3', unread: true },
      { id: 'm4', unread: false },
    ]);
    expect(provider.readIds.sort()).toEqual(['m1', 'm3', 'm4']);
  });

  it('reads changes again from where the provider stands at that moment', async () => {
    await copyWholeMailbox();

    expect(await storedMailbox()).toMatchObject({ syncCursor: '6' });
    expect((await storedMailbox())?.initialSyncCompletedAt).toBeInstanceOf(Date);
  });

  it('keeps the mails stored until the copy has seen the whole mailbox', async () => {
    await copyMailboxPage(context, mailboxId, neverStopped);

    const stored = await database.select({ id: message.providerMessageId }).from(message);
    expect(stored.map((row) => row.id)).toContain('m2');
  });
});
