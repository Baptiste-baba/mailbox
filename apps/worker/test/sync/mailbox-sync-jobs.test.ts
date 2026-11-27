import { setTimeout as wait } from 'node:timers/promises';
import { type Database, mailbox, message } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJobQueue } from '../../src/job-queue.ts';
import { registerMailboxSyncJobs } from '../../src/sync/mailbox-sync-jobs.ts';
import { FakeProvider } from './fake-provider.ts';
import {
  insertTestMailbox,
  openTestDatabase,
  resetMailTables,
  testMail,
  testSyncContext,
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

describe('the copy of the mailboxes, in the background', { timeout: 40_000 }, () => {
  it('copies a connected mailbox down to its oldest mail, a page calling for the next', async () => {
    const provider = new FakeProvider();
    provider.mails = ['m5', 'm4', 'm3', 'm2', 'm1'].map((id) => testMail(id));
    const mailboxId = await insertTestMailbox(database);

    await registerMailboxSyncJobs(jobQueue, testSyncContext(database, provider));
    await waitForCopy(database, mailboxId);

    const stored = await database.select({ id: message.providerMessageId }).from(message);
    expect(stored.map((row) => row.id).sort()).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(provider.pagesAsked).toEqual([null, '2', '4']);
  });
});

describe('the changes of the mailboxes, in the background', { timeout: 40_000 }, () => {
  it('stores what changed in a mailbox copied already', async () => {
    const provider = new FakeProvider();
    provider.mails = [testMail('m1')];
    const mailboxId = await insertTestMailbox(database);
    const context = testSyncContext(database, provider);
    await registerMailboxSyncJobs(jobQueue, context);
    await waitForCopy(database, mailboxId);
    await jobQueue.stop({ graceful: true });

    provider.receive(testMail('m2'));
    jobQueue = createJobQueue(process.env.DATABASE_URL ?? '', logger);
    await jobQueue.start();
    await registerMailboxSyncJobs(jobQueue, context);

    await expect
      .poll(async () => (await database.select().from(message)).length, { timeout: COPY_WAIT_MS })
      .toBe(2);
  });
});
