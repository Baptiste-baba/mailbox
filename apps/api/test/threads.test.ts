import { randomUUID } from 'node:crypto';
import { attachment, type Database, message } from '@mailbox/db';
import {
  errorResponseSchema,
  type ThreadSummary,
  threadPageSchema,
  threadSchema,
} from '@mailbox/shared';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';
import { insertTestMailbox, insertTestThread, resetMailTables } from './test-mail.ts';

const HOUR_MS = 60 * 60 * 1_000;
const NEWEST = new Date('2026-11-10T18:00:00.000Z');
const INBOX_THREADS_AT_WORK = 23;
const ARCHIVED_THREADS_AT_WORK = 4;
const INBOX_THREADS_AT_HOME = 3;

let api: RunningApi;
let database: Database;
let cookie: string;
let work: string;
let home: string;
let conversation: string;

function hoursBefore(hours: number): Date {
  return new Date(NEWEST.getTime() - hours * HOUR_MS);
}

/** Two mailboxes; at work, every fourth inbox thread is unread, and two threads share a date. */
async function storeMail(): Promise<void> {
  work = await insertTestMailbox(database, { name: 'Travail', address: 'alex@studio.example' });
  home = await insertTestMailbox(database, { name: 'Perso', address: 'alex@home.example' });
  for (let rank = 0; rank < INBOX_THREADS_AT_WORK; rank += 1) {
    const lastMessageAt = hoursBefore(rank === 1 ? 0 : rank);
    await insertTestThread(database, work, { lastMessageAt, unread: rank % 4 === 0 });
  }
  for (let rank = 0; rank < ARCHIVED_THREADS_AT_WORK; rank += 1) {
    const lastMessageAt = hoursBefore(rank + 0.5);
    await insertTestThread(database, work, { lastMessageAt, inInbox: false, unread: rank === 0 });
  }
  for (let rank = 0; rank < INBOX_THREADS_AT_HOME - 1; rank += 1) {
    await insertTestThread(database, home, { lastMessageAt: hoursBefore(rank + 0.25) });
  }
  conversation = await insertTestThread(database, home, {
    lastMessageAt: hoursBefore(30),
    messageCount: 3,
  });
}

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  cookie = await signInOnFreshInstance(api, database);
  await resetMailTables(database);
  await storeMail();
});

afterAll(async () => {
  await resetMailTables(database);
  await api.close();
  await database.$client.end();
});

/** Reads the api as the signed-in user. */
function get(path: string): Promise<Response> {
  return fetch(`${api.url}/api${path}`, { headers: { cookie } });
}

function getThreads(query: string): Promise<Response> {
  return get(`/threads?${query}`);
}

async function walkAllPages(query: string, limit: number): Promise<ThreadSummary[]> {
  const threads: ThreadSummary[] = [];
  let cursor: string | null = null;
  do {
    const after: string = cursor === null ? '' : `&cursor=${cursor}`;
    const response = await getThreads(`${query}&limit=${limit}${after}`);
    const page = threadPageSchema.parse(await response.json());
    threads.push(...page.threads);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return threads;
}

async function firstMessageOf(threadId: string): Promise<string> {
  const [first] = await database
    .select({ id: message.id })
    .from(message)
    .where(eq(message.threadId, threadId))
    .orderBy(asc(message.sentAt))
    .limit(1);
  if (first === undefined) {
    throw new Error(`Thread ${threadId} has no message`);
  }
  return first.id;
}

describe('GET /api/threads', () => {
  it('pages through a view, most recent first, without gap or duplicate', async () => {
    const inOnePage = threadPageSchema.parse(
      await (await getThreads('view=inbox&limit=100')).json(),
    );
    const pageByPage = await walkAllPages('view=inbox', 7);

    expect(inOnePage.nextCursor).toBeNull();
    expect(inOnePage.threads).toHaveLength(INBOX_THREADS_AT_WORK + INBOX_THREADS_AT_HOME);
    expect(pageByPage).toEqual(inOnePage.threads);
    const dates = pageByPage.map((thread) => thread.lastMessageAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('describes a thread as it is stored', async () => {
    const inbox = await walkAllPages('view=inbox', 100);

    expect(inbox.find((thread) => thread.id === conversation)).toEqual({
      id: conversation,
      mailboxId: home,
      subject: 'Devis signé',
      sender: { name: 'Camille Roux', address: 'camille.roux@example.com' },
      snippet: 'Bonjour, voici le devis signé.',
      lastMessageAt: hoursBefore(30).toISOString(),
      unread: false,
      messageCount: 3,
      hasAttachments: false,
    });
  });

  it('shows archived threads among all mails only', async () => {
    const inbox = await walkAllPages('view=inbox', 100);
    const all = await walkAllPages('view=all', 10);

    expect(all).toHaveLength(inbox.length + ARCHIVED_THREADS_AT_WORK);
    expect(inbox.every((thread) => all.some((candidate) => candidate.id === thread.id))).toBe(true);
  });
});

describe('GET /api/threads, filtered', () => {
  it('filters by mailbox and by unread state', async () => {
    const atHome = await walkAllPages(`view=inbox&mailboxId=${home}`, 100);
    const unreadAtWork = await walkAllPages(`view=inbox&mailboxId=${work}&unreadOnly=true`, 4);
    const unreadAnywhere = await walkAllPages('view=all&unreadOnly=true', 100);

    expect(atHome).toHaveLength(INBOX_THREADS_AT_HOME);
    expect(atHome.every((thread) => thread.mailboxId === home)).toBe(true);
    expect(unreadAtWork).toHaveLength(Math.ceil(INBOX_THREADS_AT_WORK / 4));
    expect(unreadAtWork.every((thread) => thread.mailboxId === work && thread.unread)).toBe(true);
    expect(unreadAnywhere).toHaveLength(unreadAtWork.length + 1);
  });

  it('lists nothing for a mailbox that is not connected', async () => {
    expect(await walkAllPages(`view=inbox&mailboxId=${randomUUID()}`, 100)).toEqual([]);
  });
});

describe('GET /api/threads, refused', () => {
  it.each([
    ['an unknown view', 'view=archives'],
    ['a page larger than allowed', 'view=inbox&limit=1000'],
    ['a cursor it did not produce', 'view=inbox&cursor=forged'],
    ['a mailbox id that cannot be one', 'view=inbox&mailboxId=mailbox-work'],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, query) => {
    const response = await getThreads(query);

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('VALIDATION_FAILED');
  });
});

describe('GET /api/threads/:threadId', () => {
  it('gives the whole thread, oldest message first', async () => {
    const response = await get(`/threads/${conversation}`);

    expect(response.status).toBe(200);
    const thread = threadSchema.parse(await response.json());
    expect(thread).toMatchObject({ id: conversation, mailboxId: home, subject: 'Devis signé' });
    expect(thread.messages.map((sent) => sent.sentAt)).toEqual(
      [30 + 2 / 60, 30 + 1 / 60, 30].map((hours) => hoursBefore(hours).toISOString()),
    );
    expect(thread.messages[0]).toMatchObject({
      from: { name: 'Camille Roux', address: 'camille.roux@example.com' },
      to: [{ name: 'Alex Martin', address: 'alex.martin@example.com' }],
      cc: [],
      bodyText: 'Bonjour, voici le devis signé.\n\nMessage 1',
      attachments: [],
    });
  });

  it('gives the files attached to a message, in their order, without those its body displays', async () => {
    const pdf = { fileName: 'devis.pdf', mimeType: 'application/pdf', size: 48_213 };
    const sheet = { fileName: 'détail.xlsx', mimeType: 'application/vnd.ms-excel', size: 9_120 };
    const logo = { fileName: 'logo.png', mimeType: 'image/png', size: 2_048 };
    const messageId = await firstMessageOf(conversation);
    await database.insert(attachment).values([
      { messageId, position: 2, ...sheet },
      { messageId, position: 1, ...logo, contentId: 'logo@studio.example' },
      { messageId, position: 0, ...pdf },
    ]);

    const response = await get(`/threads/${conversation}`);

    const thread = threadSchema.parse(await response.json());
    expect(thread.messages[0]?.attachments).toMatchObject([pdf, sheet]);
    expect(thread.messages[1]?.attachments).toEqual([]);
  });
});

describe('GET /api/threads/:threadId, refused', () => {
  it.each([
    ['a thread that does not exist', randomUUID()],
    ['an id that cannot be one', 'thread-0'],
  ])('answers 404 THREAD_NOT_FOUND for %s', async (_case, threadId) => {
    const response = await get(`/threads/${threadId}`);

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('THREAD_NOT_FOUND');
  });
});
