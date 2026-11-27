import { randomUUID } from 'node:crypto';
import type { Database } from '@mailbox/db';
import { errorResponseSchema } from '@mailbox/shared';
import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type EventStream, openEventStream } from './event-stream.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

let api: RunningApi;
let database: Database;
let cookie: string;
let stream: EventStream | undefined;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  cookie = await signInOnFreshInstance(api, database);
});

afterEach(() => {
  stream?.close();
  stream = undefined;
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

/** What the worker does when a mailbox changes. */
async function notify(mailboxId: string): Promise<void> {
  await database.execute(sql`select pg_notify('mailbox_changes', ${mailboxId})`);
}

describe('GET /api/events', () => {
  it('tells the app a mailbox changed, as soon as the worker says so', async () => {
    const mailboxId = randomUUID();
    stream = await openEventStream(`${api.url}/api/events`, cookie);

    await notify(mailboxId);

    expect(await stream.next()).toEqual({ type: 'mailboxChanged', mailboxId });
  });

  it('tells a burst of changes of a mailbox twice: at its start, and at its end', async () => {
    const mailboxId = randomUUID();
    stream = await openEventStream(`${api.url}/api/events`, cookie);

    for (let change = 0; change < 5; change += 1) {
      await notify(mailboxId);
    }

    expect(await stream.within(1500)).toEqual([
      { type: 'mailboxChanged', mailboxId },
      { type: 'mailboxChanged', mailboxId },
    ]);
  });

  it('tells the app to read everything again after listening was interrupted', async () => {
    stream = await openEventStream(`${api.url}/api/events`, cookie);

    await database.execute(
      sql`select pg_terminate_backend(pid) from pg_stat_activity where datname = current_database() and query = 'listen mailbox_changes'`,
    );

    expect(await stream.next()).toEqual({ type: 'resync' });
  });

  it('answers 401 UNAUTHENTICATED without a session', async () => {
    const response = await fetch(`${api.url}/api/events`);

    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('UNAUTHENTICATED');
  });
});
