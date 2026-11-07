import { folderListSchema, mailboxListSchema, threadPageSchema } from '@mailbox/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';

describe('sidebar data', () => {
  let api: RunningApi;

  beforeAll(async () => {
    api = await startApi();
  });

  afterAll(async () => {
    await api.close();
  });

  it('lists the mailboxes, with the unread threads of their inbox', async () => {
    const response = await fetch(`${api.url}/api/mailboxes`);

    expect(response.status).toBe(200);
    const { mailboxes } = mailboxListSchema.parse(await response.json());
    expect(mailboxes.length).toBeGreaterThan(0);
    for (const mailbox of mailboxes) {
      const inbox = await fetch(
        `${api.url}/api/threads?view=inbox&mailboxId=${mailbox.id}&unreadOnly=true&limit=100`,
      );
      expect(threadPageSchema.parse(await inbox.json()).threads).toHaveLength(mailbox.unreadCount);
    }
  });

  it('lists the folders', async () => {
    const response = await fetch(`${api.url}/api/folders`);

    expect(response.status).toBe(200);
    expect(folderListSchema.parse(await response.json()).folders.length).toBeGreaterThan(0);
  });
});
