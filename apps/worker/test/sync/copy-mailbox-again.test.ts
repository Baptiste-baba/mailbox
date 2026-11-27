import { type Database, message } from '@mailbox/db';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { type CopyOutcome, copyMailboxPage } from '../../src/sync/copy-mailbox-page.ts';
import type { SyncContext } from '../../src/sync/sync-context.ts';
import { syncMailboxChanges } from '../../src/sync/sync-mailbox-changes.ts';
import { FakeProvider } from './fake-provider.ts';
import {
  insertTestMailbox,
  neverStopped,
  openTestDatabase,
  resetMailTables,
  storedMailbox,
  testMail,
  testSyncContext,
} from './test-mail.ts';

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

    expect((await storedMailbox(database, mailboxId))?.syncCursor).toBe('0');
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

    expect(await storedMailbox(database, mailboxId)).toMatchObject({ syncCursor: '6' });
    expect((await storedMailbox(database, mailboxId))?.initialSyncCompletedAt).toBeInstanceOf(Date);
  });

  it('keeps the mails stored until the copy has seen the whole mailbox', async () => {
    await copyMailboxPage(context, mailboxId, neverStopped);

    const stored = await database.select({ id: message.providerMessageId }).from(message);
    expect(stored.map((row) => row.id)).toContain('m2');
  });
});

describe('a copy started over while one of its pages is being copied', () => {
  /** Before the next mail is read, the changes are read and Gmail no longer keeps them. */
  function loseChangesDuringNextRead(): void {
    provider.beforeRead = async () => {
      provider.beforeRead = undefined;
      provider.oldestCursorKept = Number.MAX_SAFE_INTEGER;
      await syncMailboxChanges(context, mailboxId, neverStopped);
      provider.oldestCursorKept = 0;
    };
  }

  // Regression: the page then wrote its own progress over the new copy, which left the mailbox
  // copied without a cursor, never to be read again.
  it('goes on with the new copy when it was the last page, and ends with a cursor', async () => {
    provider.mails = [testMail('m2'), testMail('m1')];
    loseChangesDuringNextRead();

    expect(await copyMailboxPage(context, mailboxId, neverStopped)).toBe('more');
    expect(await storedMailbox(database, mailboxId)).toMatchObject({
      initialSyncCompletedAt: null,
      syncCursor: null,
    });
    await copyWholeMailbox();

    expect((await storedMailbox(database, mailboxId))?.syncCursor).not.toBeNull();
    expect((await storedMailbox(database, mailboxId))?.initialSyncCompletedAt).toBeInstanceOf(Date);
  });

  // Regression: the new copy then went on from the page after, and removed at its end the most
  // recent mails, stored before it started, although Gmail still had them.
  it('starts the listing again from its first page, and keeps every mail Gmail has', async () => {
    provider.mails = ['m5', 'm4', 'm3', 'm2', 'm1'].map((id) => testMail(id));
    await copyMailboxPage(context, mailboxId, neverStopped);
    loseChangesDuringNextRead();

    await copyMailboxPage(context, mailboxId, neverStopped);
    expect((await storedMailbox(database, mailboxId))?.initialSyncPageToken).toBeNull();
    await copyWholeMailbox();

    const stored = await database.select({ id: message.providerMessageId }).from(message);
    expect(stored.map((row) => row.id).sort()).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
  });
});
