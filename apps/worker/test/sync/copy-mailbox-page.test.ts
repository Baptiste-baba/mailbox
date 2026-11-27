import { type Database, folder, mailbox, message } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { copyMailboxPage } from '../../src/sync/copy-mailbox-page.ts';
import type { SyncContext } from '../../src/sync/sync-context.ts';
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
  provider.mails = ['m5', 'm4', 'm3', 'm2', 'm1'].map((id) => testMail(id));
  context = testSyncContext(database, provider);
});

afterAll(async () => {
  await database.$client.end();
});

const copyPage = () => copyMailboxPage(context, mailboxId, neverStopped);

async function storedIds(): Promise<string[]> {
  const stored = await database.select({ id: message.providerMessageId }).from(message);
  return stored.map((row) => row.id).sort();
}

async function storedMailbox() {
  const [stored] = await database.select().from(mailbox).where(eq(mailbox.id, mailboxId));
  return stored;
}

describe('copying a mailbox, page after page', () => {
  it('copies the most recent mails first, and remembers where to go on', async () => {
    const outcome = await copyPage();

    expect(outcome).toBe('more');
    expect(await storedIds()).toEqual(['m4', 'm5']);
    expect(await storedMailbox()).toMatchObject({
      initialSyncPageToken: '2',
      initialSyncCompletedAt: null,
    });
  });

  it('goes on from the page it stopped at, down to the oldest mail', async () => {
    await copyPage();

    expect(await copyPage()).toBe('more');
    expect(await copyPage()).toBe('done');

    expect(await storedIds()).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(provider.pagesAsked).toEqual([null, '2', '4']);
    const stored = await storedMailbox();
    expect(stored?.initialSyncPageToken).toBeNull();
    expect(stored?.initialSyncCompletedAt).toBeInstanceOf(Date);
  });

  it('has nothing left to do for a mailbox copied already', async () => {
    await copyPage();
    await copyPage();
    await copyPage();
    provider.readIds = [];

    expect(await copyPage()).toBe('done');

    expect(provider.readIds).toEqual([]);
  });

  it('stores the folders of the mailbox, and files its mails in them', async () => {
    provider.folders = [{ providerFolderId: 'Label_1', name: 'Factures' }];
    provider.mails = [testMail('m1', { providerFolderIds: ['Label_1'] })];

    await copyPage();

    expect(await database.select({ name: folder.name }).from(folder)).toEqual([
      { name: 'Factures' },
    ]);
  });
});

describe('copying a mailbox, when a page does not go through', () => {
  it('fails on a mail the provider does not give, then copies the page again without reading twice', async () => {
    provider.unreachableIds.add('m4');
    await expect(copyPage()).rejects.toMatchObject({ code: 'MAIL_PROVIDER_UNAVAILABLE' });
    expect(await storedIds()).toEqual(['m5']);
    expect((await storedMailbox())?.initialSyncPageToken).toBeNull();

    provider.unreachableIds.clear();
    provider.readIds = [];
    await copyPage();

    expect(provider.readIds).toEqual(['m4']);
    expect(await storedIds()).toEqual(['m4', 'm5']);
  });

  it('skips a mail the provider no longer gives once listed', async () => {
    provider.goneOnceListed.add('m5');

    expect(await copyPage()).toBe('more');

    expect(await storedIds()).toEqual(['m4']);
  });
});

describe('copying a mailbox, when the copy is interrupted', () => {
  it('starts the listing again when the provider lost the page, without reading stored mails again', async () => {
    await copyPage();
    provider.lostPages.add('2');

    expect(await copyPage()).toBe('more');
    expect((await storedMailbox())?.initialSyncPageToken).toBeNull();
    provider.lostPages.clear();
    provider.readIds = [];
    await copyPage();
    await copyPage();
    await copyPage();

    expect(provider.readIds).toEqual(['m3', 'm2', 'm1']);
    expect((await storedMailbox())?.initialSyncCompletedAt).toBeInstanceOf(Date);
  });

  it('stops between two mails when the worker stops', async () => {
    const stopped = AbortSignal.abort();

    await expect(copyMailboxPage(context, mailboxId, stopped)).rejects.toThrow();

    expect(await storedIds()).toEqual([]);
  });
});

describe('copying a mailbox that cannot be read', () => {
  it('marks as to reconnect a mailbox whose provider withdrew the access, and copies nothing', async () => {
    provider.accessWithdrawn = true;

    expect(await copyPage()).toBe('done');

    expect((await storedMailbox())?.status).toBe('reconnect_required');
    expect(await storedIds()).toEqual([]);
  });

  it('marks as to reconnect a mailbox whose token the key no longer opens', async () => {
    await database.update(mailbox).set({ refreshTokenEncrypted: 'sealed-with-another-key' });

    expect(await copyPage()).toBe('done');

    expect((await storedMailbox())?.status).toBe('reconnect_required');
  });

  it('leaves alone a mailbox waiting for its user to sign in again', async () => {
    await database.update(mailbox).set({ status: 'reconnect_required' });

    expect(await copyPage()).toBe('done');

    expect(provider.pagesAsked).toEqual([]);
  });

  it('has nothing to do for a mailbox removed meanwhile', async () => {
    await resetMailTables(database);

    expect(await copyPage()).toBe('done');
  });

  it('fails for a mailbox of a provider this server has no client for', async () => {
    context.providers = new Map();

    await expect(copyPage()).rejects.toMatchObject({ code: 'MAIL_PROVIDER_NOT_CONFIGURED' });
    expect((await storedMailbox())?.status).toBe('connected');
  });
});
