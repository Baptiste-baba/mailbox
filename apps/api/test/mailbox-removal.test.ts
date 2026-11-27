import { randomUUID } from 'node:crypto';
import { type Database, thread } from '@mailbox/db';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCode } from './auth-requests.ts';
import { openEventStream } from './event-stream.ts';
import { type FakeGoogle, installFakeGoogle } from './fake-google.ts';
import { type ApiCaller, callApi, TEST_GOOGLE_CLIENT } from './mailbox-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';
import {
  insertTestMailbox,
  insertTestThread,
  resetMailTables,
  sealTestToken,
  storedMailbox,
} from './test-mail.ts';

const MAILBOX = { name: 'Perso', address: 'alex.martin@example.com' };

let api: RunningApi;
let database: Database;
let user: ApiCaller;
let cookie: string;
let google: FakeGoogle;

beforeAll(async () => {
  api = await startApi(TEST_GOOGLE_CLIENT);
  database = openTestDatabase();
});

afterAll(async () => {
  await resetMailTables(database);
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  google = installFakeGoogle();
  await resetMailTables(database);
  cookie = await signInOnFreshInstance(api, database);
  user = { api, cookie };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function insertConnectedMailbox(): Promise<string> {
  return insertTestMailbox(database, {
    ...MAILBOX,
    refreshTokenEncrypted: sealTestToken('token-of-the-mailbox'),
  });
}

describe('removing a mailbox', () => {
  it('ends its access at Google, then removes it with its mail', async () => {
    const mailboxId = await insertConnectedMailbox();
    await insertTestThread(database, mailboxId, { lastMessageAt: new Date() });

    const response = await callApi(user, 'DELETE', `/mailboxes/${mailboxId}`);

    expect(response.status).toBe(204);
    expect(google.revokedTokens).toEqual(['token-of-the-mailbox']);
    expect(await storedMailbox(database, mailboxId)).toBeUndefined();
    expect(await database.$count(thread)).toBe(0);
  });

  it('tells the other devices of the user', async () => {
    const mailboxId = await insertConnectedMailbox();
    const stream = await openEventStream(`${api.url}/api/events`, cookie);

    await callApi(user, 'DELETE', `/mailboxes/${mailboxId}`);

    expect(await stream.next()).toEqual({ type: 'mailboxChanged', mailboxId });
    stream.close();
  });

  it('keeps the mailbox when Google does not end the access', async () => {
    const mailboxId = await insertConnectedMailbox();
    google.failsToEndAccesses = true;

    const response = await callApi(user, 'DELETE', `/mailboxes/${mailboxId}`);

    expect(response.status).toBe(502);
    expect(await errorCode(response)).toBe('MAIL_PROVIDER_UNAVAILABLE');
    expect(await storedMailbox(database, mailboxId)).toBeDefined();
  });
});

describe('removing a mailbox that has no access left to end', () => {
  it('removes one whose token can no longer be read, without asking Google', async () => {
    const mailboxId = await insertTestMailbox(database, {
      ...MAILBOX,
      refreshTokenEncrypted: 'sealed-with-a-key-long-gone',
    });

    const response = await callApi(user, 'DELETE', `/mailboxes/${mailboxId}`);

    expect(response.status).toBe(204);
    expect(google.revokedTokens).toEqual([]);
    expect(await database.$count(thread)).toBe(0);
  });

  it('changes nothing for one already gone', async () => {
    const response = await callApi(user, 'DELETE', `/mailboxes/${randomUUID()}`);

    expect(response.status).toBe(204);
    expect(google.revokedTokens).toEqual([]);
  });

  it('answers 400 VALIDATION_FAILED for an id that cannot be one', async () => {
    const response = await callApi(user, 'DELETE', '/mailboxes/mailbox-work');

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});
