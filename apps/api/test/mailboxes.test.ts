import type { Database } from '@mailbox/db';
import { folderListSchema, mailboxListSchema, threadPageSchema } from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

describe('sidebar data', () => {
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

  it('lists the mailboxes, with the unread threads of their inbox', async () => {
    const response = await fetch(`${api.url}/api/mailboxes`, { headers: { cookie } });

    expect(response.status).toBe(200);
    const { mailboxes } = mailboxListSchema.parse(await response.json());
    expect(mailboxes.length).toBeGreaterThan(0);
    for (const mailbox of mailboxes) {
      const inbox = await fetch(
        `${api.url}/api/threads?view=inbox&mailboxId=${mailbox.id}&unreadOnly=true&limit=100`,
        { headers: { cookie } },
      );
      expect(threadPageSchema.parse(await inbox.json()).threads).toHaveLength(mailbox.unreadCount);
    }
  });

  it('lists the folders', async () => {
    const response = await fetch(`${api.url}/api/folders`, { headers: { cookie } });

    expect(response.status).toBe(200);
    expect(folderListSchema.parse(await response.json()).folders.length).toBeGreaterThan(0);
  });
});
