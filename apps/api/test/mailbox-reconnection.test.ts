import { randomUUID } from 'node:crypto';
import type { Database } from '@mailbox/db';
import { mailboxSummarySchema } from '@mailbox/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCode } from './auth-requests.ts';
import { type FakeGoogle, installFakeGoogle } from './fake-google.ts';
import {
  type ApiCaller,
  callApi,
  completeConnection,
  startConnection,
  TEST_GOOGLE_CLIENT,
} from './mailbox-requests.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';
import { insertTestMailbox, resetMailTables, sealTestToken, storedMailbox } from './test-mail.ts';

let api: RunningApi;
let database: Database;
let user: ApiCaller;
let google: FakeGoogle;
/** A mailbox whose provider no longer accepts the token. */
let mailboxId: string;

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
  user = { api, cookie: await signInOnFreshInstance(api, database) };
  mailboxId = await insertTestMailbox(database, {
    name: 'Perso',
    address: 'alex.martin@example.com',
    status: 'reconnect_required',
    refreshTokenEncrypted: sealTestToken('refused-token'),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function startReconnection(id = mailboxId): Promise<URL> {
  return startConnection(user, `/mailboxes/${id}/reconnection`, undefined);
}

describe('starting to reconnect a mailbox', () => {
  it('sends the user to Google, suggesting the address of the mailbox', async () => {
    const url = await startReconnection();

    expect(url.hostname).toBe('accounts.google.com');
    expect(url.searchParams.get('login_hint')).toBe('alex.martin@example.com');
  });

  it('answers 404 MAILBOX_NOT_FOUND for a mailbox that does not exist', async () => {
    const response = await callApi(user, 'POST', `/mailboxes/${randomUUID()}/reconnection`);

    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe('MAILBOX_NOT_FOUND');
  });

  it('answers 400 VALIDATION_FAILED for an id that cannot be one', async () => {
    const response = await callApi(user, 'POST', '/mailboxes/mailbox-work/reconnection');

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});

describe('finishing to reconnect a mailbox', () => {
  it('gives the mailbox its access back, with the new token', async () => {
    const response = await completeConnection(user, await startReconnection());

    expect(response.status).toBe(200);
    expect(mailboxSummarySchema.parse(await response.json())).toMatchObject({
      id: mailboxId,
      name: 'Perso',
      status: 'connected',
    });
    expect((await storedMailbox(database, mailboxId))?.refreshToken).toBe('refresh-token-1');
  });

  it('refuses another account than the one of the mailbox, and changes nothing', async () => {
    google.account = 'camille.roux@example.com';

    const response = await completeConnection(user, await startReconnection());

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('MAILBOX_ACCOUNT_MISMATCH');
    expect(await storedMailbox(database, mailboxId)).toMatchObject({
      address: 'alex.martin@example.com',
      status: 'reconnect_required',
      refreshToken: 'refused-token',
    });
  });

  it('answers 404 MAILBOX_NOT_FOUND when the mailbox was removed meanwhile', async () => {
    const url = await startReconnection();
    await resetMailTables(database);

    const response = await completeConnection(user, url);

    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe('MAILBOX_NOT_FOUND');
  });
});
