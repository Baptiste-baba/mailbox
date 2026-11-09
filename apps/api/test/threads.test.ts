import type { Database } from '@mailbox/db';
import {
  errorResponseSchema,
  type ThreadSummary,
  threadPageSchema,
  threadSchema,
} from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

let api: RunningApi;
let database: Database;
let cookie: string;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  cookie = await signInOnFreshInstance(api, database);
});

afterAll(async () => {
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

describe('GET /api/threads', () => {
  it('pages through a view, most recent first, without gap or duplicate', async () => {
    const inOnePage = threadPageSchema.parse(
      await (await getThreads('view=inbox&limit=100')).json(),
    );
    const pageByPage = await walkAllPages('view=inbox', 7);

    expect(inOnePage.nextCursor).toBeNull();
    expect(pageByPage).toEqual(inOnePage.threads);
    const dates = pageByPage.map((thread) => thread.lastMessageAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('shows archived threads among all mails only', async () => {
    const inbox = await walkAllPages('view=inbox', 100);
    const all = await walkAllPages('view=all', 100);

    expect(all.length).toBeGreaterThan(inbox.length);
    expect(inbox.every((thread) => all.some((candidate) => candidate.id === thread.id))).toBe(true);
  });

  it('filters by mailbox and by unread state', async () => {
    const unread = await walkAllPages('view=inbox&mailboxId=mailbox-work&unreadOnly=true', 100);

    expect(unread.length).toBeGreaterThan(0);
    expect(unread.every((thread) => thread.mailboxId === 'mailbox-work' && thread.unread)).toBe(
      true,
    );
  });

  it.each([
    ['an unknown view', 'view=archives'],
    ['a page larger than allowed', 'view=inbox&limit=1000'],
    ['a cursor it did not produce', 'view=inbox&cursor=forged'],
  ])('answers 400 VALIDATION_FAILED for %s', async (_case, query) => {
    const response = await getThreads(query);

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('VALIDATION_FAILED');
  });
});

describe('GET /api/threads/:threadId', () => {
  it('gives the whole thread, oldest message first', async () => {
    const inbox = await walkAllPages('view=inbox', 100);
    const summary = inbox.find((thread) => thread.messageCount > 1);
    const response = await get(`/threads/${summary?.id}`);

    expect(response.status).toBe(200);
    const thread = threadSchema.parse(await response.json());
    expect(thread.messages).toHaveLength(summary?.messageCount ?? 0);
    expect(thread.messages.at(-1)?.sentAt).toBe(summary?.lastMessageAt);
  });

  it('answers 404 THREAD_NOT_FOUND for a thread that does not exist', async () => {
    const response = await get('/threads/thread-0');

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('THREAD_NOT_FOUND');
  });
});
