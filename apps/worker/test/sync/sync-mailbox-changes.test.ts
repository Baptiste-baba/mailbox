import { type Database, mailbox, message, thread } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { copyMailboxPage } from '../../src/sync/copy-mailbox-page.ts';
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

/** A mailbox of two mails, copied: what happens at the provider from now on is a change. */
beforeEach(async () => {
  database ??= openTestDatabase();
  await resetMailTables(database);
  mailboxId = await insertTestMailbox(database);
  provider = new FakeProvider();
  provider.mails = [testMail('m2', { unread: true }), testMail('m1')];
  context = testSyncContext(database, provider);
  await copyMailboxPage(context, mailboxId, neverStopped);
  provider.readIds = [];
});

afterAll(async () => {
  await database.$client.end();
});

const syncChanges = () => syncMailboxChanges(context, mailboxId, neverStopped);

async function storedMail(providerMessageId: string) {
  const [stored] = await database
    .select()
    .from(message)
    .where(eq(message.providerMessageId, providerMessageId));
  return stored;
}

describe('reading what changed in a mailbox', () => {
  it('stores a mail that arrived', async () => {
    provider.receive(testMail('m3', { unread: true }));

    await syncChanges();

    expect(await storedMail('m3')).toMatchObject({ unread: true, inInbox: true });
    expect(provider.readIds).toEqual(['m3']);
  });

  it('follows a mail read, then archived, at the provider', async () => {
    provider.receive(testMail('m2', { unread: false, inInbox: false }));

    await syncChanges();

    expect(await storedMail('m2')).toMatchObject({ unread: false, inInbox: false });
    const [summary] = await database.select().from(thread).where(eq(thread.subject, 'Sujet m2'));
    expect(summary).toMatchObject({ unread: false, inInbox: false });
  });

  it('removes a mail deleted or marked as spam at the provider, without reading it', async () => {
    provider.discard('m1');

    await syncChanges();

    expect(await storedMail('m1')).toBeUndefined();
    expect(await database.select().from(thread)).toHaveLength(1);
    expect(provider.readIds).toEqual([]);
  });

  it('reads nothing when nothing changed, and only what changed since the last time', async () => {
    await syncChanges();
    expect(provider.readIds).toEqual([]);

    provider.receive(testMail('m3'));
    await syncChanges();
    provider.receive(testMail('m4'));
    await syncChanges();

    expect(provider.readIds).toEqual(['m3', 'm4']);
  });
});

describe('reading what changed, when it does not go through', () => {
  it('reads the same changes again after a run that failed', async () => {
    provider.receive(testMail('m3'));
    provider.receive(testMail('m4'));
    provider.unreachableIds.add('m4');
    await expect(syncChanges()).rejects.toMatchObject({ code: 'MAIL_PROVIDER_UNAVAILABLE' });

    provider.unreachableIds.clear();
    await syncChanges();

    expect(await storedMail('m4')).toBeDefined();
    expect(provider.readIds).toEqual(['m3', 'm4', 'm3', 'm4']);
  });

  it('starts the copy of the mailbox over when the provider no longer keeps what changed', async () => {
    const copiedAt = (await storedMailbox(database, mailboxId))?.initialSyncStartedAt;
    provider.oldestCursorKept = 5;

    await syncChanges();

    const stored = await storedMailbox(database, mailboxId);
    expect(stored).toMatchObject({
      syncCursor: null,
      initialSyncPageToken: null,
      initialSyncCompletedAt: null,
    });
    expect(stored?.initialSyncStartedAt.getTime()).toBeGreaterThan(copiedAt?.getTime() ?? 0);
  });

  it('marks as to reconnect a mailbox whose provider withdrew the access', async () => {
    context.accesses.clear();
    provider.accessWithdrawn = true;

    await syncChanges();

    expect((await storedMailbox(database, mailboxId))?.status).toBe('reconnect_required');
  });

  it('waits for the copy to start before reading changes', async () => {
    await database.update(mailbox).set({ syncCursor: null });
    provider.receive(testMail('m3'));

    await syncChanges();

    expect(provider.readIds).toEqual([]);
  });
});

describe('the access to a mailbox, from one run to the next', () => {
  it('is asked of the provider once, and used while it holds', async () => {
    provider.receive(testMail('m3'));
    await syncChanges();
    await syncChanges();

    expect(provider.renewals).toBe(1);
  });

  it('is asked again once the user signed in again', async () => {
    await insertTestMailbox(database, { address: 'other@example.com' });
    const [other] = await database
      .select()
      .from(mailbox)
      .where(eq(mailbox.address, 'other@example.com'));
    await database
      .update(mailbox)
      .set({ refreshTokenEncrypted: other?.refreshTokenEncrypted ?? '' })
      .where(eq(mailbox.id, mailboxId));

    await syncChanges();

    expect(provider.renewals).toBe(2);
  });
});
