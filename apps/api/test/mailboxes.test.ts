import { type Database, message } from '@mailbox/db';
import { mailboxListSchema } from '@mailbox/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';
import {
  insertTestMailbox,
  insertTestThread,
  resetMailTables,
  TEST_REFRESH_TOKEN,
} from './test-mail.ts';

let api: RunningApi;
let database: Database;
let cookie: string;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  cookie = await signInOnFreshInstance(api, database);
});

afterAll(async () => {
  await resetMailTables(database);
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  await resetMailTables(database);
});

function getMailboxes(): Promise<Response> {
  return fetch(`${api.url}/api/mailboxes`, { headers: { cookie } });
}

describe('GET /api/mailboxes', () => {
  it('lists no mailbox before one is connected', async () => {
    const response = await getMailboxes();

    expect(response.status).toBe(200);
    expect(mailboxListSchema.parse(await response.json()).mailboxes).toEqual([]);
  });

  it('lists the mailboxes in the order they were connected, with what the sidebar shows', async () => {
    const work = { name: 'Travail', address: 'alex@studio.example' };
    const personal = { name: 'Perso', address: 'alex.martin@example.com' };
    await insertTestMailbox(database, { ...work, createdAt: new Date('2026-11-02T10:00:00Z') });
    await insertTestMailbox(database, {
      ...personal,
      status: 'reconnect_required',
      createdAt: new Date('2026-11-01T10:00:00Z'),
    });

    const response = await getMailboxes();

    const { mailboxes } = mailboxListSchema.parse(await response.json());
    expect(mailboxes).toMatchObject([
      { ...personal, provider: 'gmail', color: 'navy', status: 'reconnectRequired' },
      { ...work, provider: 'gmail', color: 'navy', status: 'connected' },
    ]);
  });

  it('never gives the token that reads a mailbox', async () => {
    await insertTestMailbox(database, { name: 'Travail', address: 'a@work.example' });

    const response = await getMailboxes();

    expect(await response.text()).not.toContain(TEST_REFRESH_TOKEN);
  });
});

describe('unread count of a mailbox', () => {
  it('counts the unread threads of its inbox', async () => {
    const lastMessageAt = new Date('2026-11-10T08:00:00Z');
    const work = await insertTestMailbox(database, { name: 'Travail', address: 'a@work.example' });
    await insertTestMailbox(database, { name: 'Perso', address: 'a@home.example' });
    await insertTestThread(database, work, { lastMessageAt, unread: true });
    await insertTestThread(database, work, { lastMessageAt, unread: true });
    await insertTestThread(database, work, { lastMessageAt, unread: false });
    await insertTestThread(database, work, { lastMessageAt, unread: true, inInbox: false });

    const response = await getMailboxes();

    const { mailboxes } = mailboxListSchema.parse(await response.json());
    expect(mailboxes.map((mailbox) => [mailbox.name, mailbox.unreadCount])).toEqual([
      ['Travail', 2],
      ['Perso', 0],
    ]);
  });
});

describe('synchronisation of a mailbox', () => {
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

  async function syncOf(values: Parameters<typeof insertTestMailbox>[1]) {
    await insertTestMailbox(database, values);
    const { mailboxes } = mailboxListSchema.parse(await (await getMailboxes()).json());
    return mailboxes[0]?.sync;
  }

  it('tells a copy under way, with the mails it stored against those announced', async () => {
    const copyStart = minutesAgo(30);
    const work = await insertTestMailbox(database, {
      name: 'Travail',
      address: 'a@work.example',
      initialSyncStartedAt: copyStart,
      initialSyncTotal: 9761,
    });
    await insertTestThread(database, work, { lastMessageAt: copyStart, messageCount: 3 });
    const earlier = await insertTestThread(database, work, {
      lastMessageAt: copyStart,
      messageCount: 2,
    });
    // Stored by an earlier copy, and not read again by this one yet.
    await database
      .update(message)
      .set({ syncedAt: minutesAgo(60) })
      .where(eq(message.threadId, earlier));

    const { mailboxes } = mailboxListSchema.parse(await (await getMailboxes()).json());

    expect(mailboxes[0]?.sync).toEqual({ state: 'copying', copiedCount: 3, totalCount: 9761 });
  });

  it('tells a mailbox copied up to date, with when it was last read', async () => {
    const lastSyncedAt = minutesAgo(1);

    const sync = await syncOf({
      name: 'Travail',
      address: 'a@work.example',
      initialSyncCompletedAt: minutesAgo(90),
      lastSyncedAt,
    });

    expect(sync).toEqual({ state: 'upToDate', checkedAt: lastSyncedAt.toISOString() });
  });
});

describe('synchronisation of a mailbox that fails', () => {
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

  async function syncOf(failingFor: number) {
    await insertTestMailbox(database, {
      name: 'Travail',
      address: 'a@work.example',
      initialSyncCompletedAt: minutesAgo(90),
      lastSyncedAt: minutesAgo(failingFor + 1),
      syncFailingSince: minutesAgo(failingFor),
      syncFailureReason: 'provider_unavailable',
    });
    const { mailboxes } = mailboxListSchema.parse(await (await getMailboxes()).json());
    return mailboxes[0]?.sync;
  }

  it('tells it interrupted once it has failed for ten minutes, and why', async () => {
    const sync = await syncOf(25);

    expect(sync).toMatchObject({ state: 'interrupted', reason: 'providerUnavailable' });
  });

  it('says nothing of a failure of a few minutes, which the next runs may get over', async () => {
    const sync = await syncOf(3);

    expect(sync).toMatchObject({ state: 'upToDate' });
  });
});
