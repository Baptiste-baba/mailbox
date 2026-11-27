import { type Database, mailbox } from '@mailbox/db';
import { AppError } from '@mailbox/shared';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { recordSyncFailure } from '../../src/sync/sync-health.ts';
import {
  insertTestMailbox,
  openTestDatabase,
  resetMailTables,
  storedMailbox,
} from './test-mail.ts';

let database: Database;
let mailboxId: string;

beforeEach(async () => {
  database ??= openTestDatabase();
  await resetMailTables(database);
  mailboxId = await insertTestMailbox(database);
});

afterAll(async () => {
  await database.$client.end();
});

describe('recording that a mailbox could not be read', () => {
  it.each([
    [new AppError('MAIL_PROVIDER_UNAVAILABLE', 'No answer'), 'provider_unavailable'],
    [new AppError('MAIL_PROVIDER_NOT_CONFIGURED', 'No client'), 'provider_not_configured'],
    [new Error('Connection terminated unexpectedly'), 'unexpected'],
  ])('tells why: %s', async (error, reason) => {
    await recordSyncFailure(database, mailboxId, error);

    expect((await storedMailbox(database, mailboxId))?.syncFailureReason).toBe(reason);
  });

  it('keeps the time of the first failure since the mailbox was last read', async () => {
    const firstFailure = new Date('2026-11-27T09:00:00.000Z');
    await database.update(mailbox).set({ syncFailingSince: firstFailure });

    await recordSyncFailure(database, mailboxId, new Error('Again'));

    expect((await storedMailbox(database, mailboxId))?.syncFailingSince).toEqual(firstFailure);
  });

  it('dates a first failure', async () => {
    await recordSyncFailure(database, mailboxId, new Error('First'));

    const failingSince = (await storedMailbox(database, mailboxId))?.syncFailingSince;
    expect(failingSince?.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });
});
