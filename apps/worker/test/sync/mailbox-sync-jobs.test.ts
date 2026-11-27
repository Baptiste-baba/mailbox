import { setTimeout as wait } from 'node:timers/promises';
import { type Database, mailbox, message } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJobQueue } from '../../src/job-queue.ts';
import { registerMailboxCopyJobs } from '../../src/sync/mailbox-copy-jobs.ts';
import { FakeProvider } from './fake-provider.ts';
import {
  insertTestMailbox,
  openTestDatabase,
  resetMailTables,
  testMail,
  testSecretBox,
} from './test-mail.ts';

const COPY_WAIT_MS = 30_000;
const logger = pino({ level: 'silent' });

async function waitForCopy(database: Database, mailboxId: string): Promise<void> {
  const deadline = Date.now() + COPY_WAIT_MS;
  while (Date.now() < deadline) {
    const [stored] = await database.select().from(mailbox).where(eq(mailbox.id, mailboxId));
    if (stored?.initialSyncCompletedAt != null) {
      return;
    }
    await wait(250);
  }
  throw new Error(`Mailbox not copied within ${COPY_WAIT_MS} ms`);
}

describe('the copy of the mailboxes, in the background', { timeout: 40_000 }, () => {
  let database: Database;
  let jobQueue: PgBoss;

  beforeEach(async () => {
    database = openTestDatabase();
    await resetMailTables(database);
    jobQueue = createJobQueue(process.env.DATABASE_URL ?? '', logger);
    await jobQueue.start();
  });

  afterEach(async () => {
    await jobQueue.stop({ graceful: false });
    await database.$client.end();
  });

  it('copies a connected mailbox down to its oldest mail, a page calling for the next', async () => {
    const provider = new FakeProvider();
    provider.mails = ['m5', 'm4', 'm3', 'm2', 'm1'].map((id) => testMail(id));
    const mailboxId = await insertTestMailbox(database);

    await registerMailboxCopyJobs(jobQueue, {
      database,
      providers: new Map([['gmail', provider]]),
      secretBox: testSecretBox(),
      logger,
      readIntervalMs: 0,
    });
    await waitForCopy(database, mailboxId);

    const stored = await database.select({ id: message.providerMessageId }).from(message);
    expect(stored.map((row) => row.id).sort()).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(provider.pagesAsked).toEqual([null, '2', '4']);
  });
});
